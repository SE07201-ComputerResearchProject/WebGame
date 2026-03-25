const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const querystring = require('qs');
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Hàm format thời gian chuẩn VNPay (YYYYMMDDHHmmss)
function getVnTime() {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// Hàm sắp xếp Object theo Alpha-B chuẩn VNPay
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
        if (obj.hasOwnProperty(key)) { str.push(encodeURIComponent(key)); }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

// 1. TẠO LINK THANH TOÁN
router.post('/create_payment_url', requireAuth, async (req, res) => {
    try {
        const amount = req.body.amount;
        if (!amount || amount < 10000) return res.status(400).json({ error: "Số tiền không hợp lệ (Tối thiểu 10,000đ)" });

        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        let vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURNURL;

        const createDate = getVnTime();
        const orderId = `${getVnTime()}_${req.user.id}`; // Mã đơn hàng (Gắn thêm ID user để dễ track)

        // Lưu trạng thái 'pending' vào CSDL trước
        const pool = getPool();
        await pool.request()
            .input('userId', sql.Int, req.user.id)
            .input('amount', sql.Int, amount)
            .input('txnRef', sql.VarChar(50), orderId)
            .query(`INSERT INTO dbo.transactions (user_id, amount, vnp_txn_ref, status) VALUES (@userId, @amount, @txnRef, 'pending')`);

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = `Nap tien cho user ${req.user.username}`;
        vnp_Params['vnp_OrderType'] = 'topup';
        vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;

        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
        res.json({ ok: true, url: vnpUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. IPN - WEBHOOK XỬ LÝ CỘNG TIỀN (VNPay gọi ngầm)
// 2. IPN - WEBHOOK XỬ LÝ CỘNG TIỀN (ĐÃ GẮN LOG THEO DÕI)
router.get('/vnpay_ipn', async (req, res) => {
    console.log("\n=================================");
    console.log("🔔 VNPAY IPN VỪA GỌI VỀ BACKEND!");
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASHSECRET;
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            console.log("✅ Bước 1: Chữ ký bảo mật hợp lệ!");
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];

            const pool = getPool();
            const checkTxn = await pool.request().input('txnRef', sql.VarChar(50), orderId).query(`SELECT * FROM dbo.transactions WHERE vnp_txn_ref = @txnRef`);
            
            if (checkTxn.recordset.length > 0) {
                const txn = checkTxn.recordset[0];
                if (txn.status === 'pending') {
                    if (rspCode === '00') {
                        console.log(`💰 Bước 2: Khách đã thanh toán ${txn.amount}đ. Bắt đầu cộng tiền cho User ID: ${txn.user_id}...`);
                        try {
                            // CỘNG TIỀN
                            await pool.request()
                                .input('txnRef', sql.VarChar(50), orderId)
                                .input('userId', sql.Int, txn.user_id)
                                .input('amount', sql.Int, txn.amount)
                                .query(`
                                    UPDATE dbo.transactions SET status = 'success' WHERE vnp_txn_ref = @txnRef;
                                    -- Dùng ISNULL để phòng trường hợp cột balance đang bị NULL
                                    UPDATE dbo.users SET balance = ISNULL(balance, 0) + @amount WHERE id = @userId;
                                    
                                `);
                            console.log("🎉 THÀNH CÔNG: Đã cộng tiền vào CSDL!");
                            return res.status(200).json({ RspCode: '00', Message: 'Success' });
                        } catch (dbErr) {
                            console.error("❌ LỖI TẠI BƯỚC CỘNG TIỀN (SQL):", dbErr.message);
                            return res.status(200).json({ RspCode: '99', Message: 'Database Error' });
                        }
                    } else {
                        console.log("⚠️ Giao dịch thất bại (Khách bấm hủy hoặc thẻ lỗi).");
                        await pool.request().input('txnRef', sql.VarChar(50), orderId).query(`UPDATE dbo.transactions SET status = 'failed' WHERE vnp_txn_ref = @txnRef`);
                        return res.status(200).json({ RspCode: '00', Message: 'Success' });
                    }
                } else {
                    console.log("⚠️ Đơn hàng này đã được cộng tiền trước đó rồi!");
                    return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
                }
            } else {
                console.log("❌ LỖI: Không tìm thấy mã giao dịch trong bảng transactions!");
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }
        } else {
            console.error("❌ LỖI BƯỚC 1: Sai chữ ký Checksum! Hãy kiểm tra lại VNP_HASHSECRET trong file .env");
            return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (err) {
        console.error("❌ LỖI KHÔNG XÁC ĐỊNH:", err.message);
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
});
module.exports = router;