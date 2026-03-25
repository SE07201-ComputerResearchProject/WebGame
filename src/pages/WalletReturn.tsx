import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Home, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const WalletReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"success" | "failed" | "loading">("loading");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    // Đọc các tham số VNPay trả về trên URL
    const responseCode = searchParams.get("vnp_ResponseCode");
    const vnpAmount = searchParams.get("vnp_Amount");

    if (vnpAmount) {
      // VNPay nhân 100 số tiền, nên ta phải chia 100 để hiển thị đúng
      setAmount(Number(vnpAmount) / 100); 
    }

    if (responseCode === "00") {
      setStatus("success");
    } else {
      setStatus("failed"); // Người dùng hủy hoặc thẻ lỗi
    }
  }, [searchParams]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center text-white">Đang xử lý giao dịch...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 text-center relative overflow-hidden animate-slide-up">
        {/* Background glow */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] ${status === 'success' ? 'bg-neon-green/20' : 'bg-destructive/20'}`} />

        {/* Icon */}
        <div className="flex justify-center mb-6 relative z-10">
          {status === "success" ? (
            <div className="rounded-full bg-neon-green/10 p-4">
              <CheckCircle2 className="w-16 h-16 text-neon-green" />
            </div>
          ) : (
            <div className="rounded-full bg-destructive/10 p-4">
              <XCircle className="w-16 h-16 text-destructive" />
            </div>
          )}
        </div>

        {/* Text */}
        <h2 className="font-display text-2xl font-bold text-foreground mb-2 relative z-10">
          {status === "success" ? "Nạp tiền thành công!" : "Giao dịch thất bại"}
        </h2>
        
        <p className="text-muted-foreground mb-8 relative z-10">
          {status === "success" 
            ? `Bạn vừa nạp thành công ${amount.toLocaleString('vi-VN')}đ vào ví.` 
            : "Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình thanh toán."}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3 relative z-10">
          <Button 
            variant={status === "success" ? "gaming" : "default"} 
            size="lg" 
            onClick={() => navigate("/")}
            className="w-full"
          >
            <Home className="w-5 h-5 mr-2" />
            Về trang chủ
          </Button>
          
          {status === "failed" && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate("/")} // Hoặc điều hướng về trang Profile/Ví của bạn
              className="w-full"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Thử nạp lại
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletReturn;