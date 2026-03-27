import { useState, useEffect } from "react";
import { X, Wallet, History, CreditCard, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import authStore from "@/lib/auth";

interface WalletModalProps { isOpen: boolean; onClose: () => void; }

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [amount, setAmount] = useState<number>(50000);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"topup" | "history">("topup");
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // State lưu User (Tự động cập nhật số dư)
  const [currentUser, setCurrentUser] = useState(authStore.getUser());
  const presets = [20000, 50000, 100000, 200000, 500000];

  // 1. Tự động kéo thông tin mới (số dư) khi mở Ví
  useEffect(() => {
    if (isOpen) {
      setCurrentUser(authStore.getUser()); // Load tạm từ bộ nhớ nhanh
      api.getMe().then(res => {
        if (res?.ok && res.user) {
          authStore.setUser(res.user); // Lưu đè dữ liệu mới vào Local Storage
          setCurrentUser(res.user);    // Cập nhật lên giao diện
        }
      }).catch(err => console.error("Lỗi đồng bộ số dư:", err));
    }
  }, [isOpen]);

  // 2. Tự động kéo lịch sử khi mở tab "Lịch sử nạp"
  useEffect(() => {
    if (isOpen && activeTab === "history") {
      api.getTransactionHistory().then(res => {
        if (res?.ok && res.transactions) {
          setTransactions(res.transactions);
        }
      }).catch(err => console.error("Lỗi lấy lịch sử:", err));
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // 3. Xử lý nút bấm nạp tiền
  const handleTopup = async () => {
    if (!currentUser) return toast({ title: "Lỗi", description: "Vui lòng đăng nhập để nạp tiền!" });
    
    // Kiểm tra giới hạn Min/Max
    if (amount < 10000) return toast({ title: "Cảnh báo", description: "Số tiền nạp tối thiểu là 10.000đ", variant: "destructive" });
    if (amount > 50000000) return toast({ title: "Cảnh báo", description: "Số tiền nạp tối đa là 50.000.000đ", variant: "destructive" });

    setIsLoading(true);
    try {
      const res = await api.createPaymentUrl(amount);
      if (res?.ok && res.url) {
        window.location.href = res.url; // Chuyển hướng sang VNPay
      } else {
        toast({ title: "Lỗi", description: res?.error || "Không thể tạo link thanh toán", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Mất kết nối tới máy chủ", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'success': return <span className="flex items-center text-xs text-emerald-500 font-medium"><CheckCircle2 className="w-3 h-3 mr-1"/>Thành công</span>;
      case 'failed': return <span className="flex items-center text-xs text-rose-500 font-medium"><XCircle className="w-3 h-3 mr-1"/>Thất bại</span>;
      default: return <span className="flex items-center text-xs text-amber-500 font-medium"><Clock className="w-3 h-3 mr-1"/>Đang chờ</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-slide-up shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-neon-orange" />
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 z-10 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-inner">
              <Wallet className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Ví Điện Tử</h2>
              <p className="text-sm text-zinc-400">Số dư: <span className="font-bold text-neon-orange">{currentUser?.balance?.toLocaleString('vi-VN') || 0} VNĐ</span></p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex bg-zinc-900 p-1 rounded-lg mb-6 border border-zinc-800">
            <button onClick={() => setActiveTab("topup")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "topup" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"}`}>
              <CreditCard className="w-4 h-4" /> Nạp tiền
            </button>
            <button onClick={() => setActiveTab("history")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "history" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500 hover:text-zinc-300"}`}>
              <History className="w-4 h-4" /> Lịch sử nạp
            </button>
          </div>

          {/* TAB CONTENT: NẠP TIỀN */}
          {activeTab === "topup" && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {presets.map((preset) => (
                  <button key={preset} onClick={() => setAmount(preset)} className={`py-3 rounded-xl border text-sm font-bold transition-all ${amount === preset ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'}`}>
                    {(preset / 1000)}K
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">VNĐ</span>
                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full h-14 pl-14 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-bold text-lg focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan transition-all outline-none" />
              </div>

              <Button onClick={handleTopup} disabled={isLoading || amount < 10000} className="w-full h-12 bg-neon-cyan hover:bg-neon-cyan/80 text-zinc-950 font-bold text-lg rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</>
                ) : (
                  "Thanh Toán VNPay"
                )}
              </Button>
            </div>
          )}

          {/* TAB CONTENT: LỊCH SỬ GIAO DỊCH */}
          {activeTab === "history" && (
            <div className="animate-fade-in">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500">Chưa có giao dịch nào.</div>
                ) : (
                  transactions.map((txn: any) => (
                    <div key={txn.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div>
                        <div className="font-bold text-zinc-200">+{txn.amount.toLocaleString('vi-VN')}đ</div>
                        <div className="text-xs text-zinc-500 font-mono mt-1">Mã GD: {txn.vnp_txn_ref || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(txn.status)}
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(txn.created_at).toLocaleDateString('vi-VN')} - {new Date(txn.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default WalletModal;

// import { useState, useEffect } from "react";
// import { X, Wallet, CreditCard, Check, Sparkles, Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import api from "@/lib/api";
// import { toast } from "@/components/ui/use-toast";
// import authStore from "@/lib/auth";

// interface WalletModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const topUpOptions = [
//   { amount: 10000, bonus: 0, label: "10.000đ" },
//   { amount: 50000, bonus: 5, label: "50.000đ" },
//   { amount: 100000, bonus: 10, label: "100.000đ" },
//   { amount: 200000, bonus: 15, label: "200.000đ" },
//   { amount: 500000, bonus: 20, label: "500.000đ" },
//   { amount: 1000000, bonus: 25, label: "1.000.000đ", popular: true },
// ];

// const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
//   const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
//   const [balance, setBalance] = useState<number>(0);
//   const [isLoading, setIsLoading] = useState(false);

// useEffect(() => {
//     const fetchFreshBalance = async () => {
//       // Chỉ gọi API khi Modal đang được mở ra
//       if (isOpen) {
//         try {
//           // Gọi API lấy dữ liệu mới nhất từ CSDL
//           const res = await api.getMe(); 
          
//           if (res?.ok && res.user) {
//             // 1. Cập nhật số dư hiển thị ngay trên màn hình nạp tiền
//             setBalance(res.user.balance);
            
//             // 2. Cập nhật lại kho lưu trữ toàn cục (authStore) 
//             // Để Header, Profile hay chỗ nào hiển thị tiền cũng tự động nhảy số theo
//             authStore.setUser(res.user); 
//           }
//         } catch (error) {
//           console.error("Lấy số dư thất bại, dùng tạm số dư cũ", error);
//           // Nếu mạng lag, dùng tạm số tiền đang lưu trong máy
//           const cachedUser = authStore.getUser();
//           setBalance(cachedUser?.balance || 0);
//         }
//       }
//     };

//     fetchFreshBalance();
//   }, [isOpen]);

//   if (!isOpen) return null;

//   const selectedOption = topUpOptions.find(opt => opt.amount === selectedAmount);

//   const handleTopUp = async () => {
//     if (!selectedAmount) return;

//     setIsLoading(true);
//     try {
//       const res = await api.createVnPayUrl({ amount: selectedAmount });
      
//       if (res?.ok && res.url) {
//         window.location.href = res.url;
//       } else {
//         toast({ 
//           title: "Lỗi thanh toán", 
//           description: res?.error || "Không thể tạo mã giao dịch. Vui lòng thử lại sau.", 
//           variant: "destructive" 
//         });
//       }
//     } catch (e) {
//       toast({ 
//         title: "Mất kết nối", 
//         description: "Không thể kết nối đến máy chủ thanh toán.", 
//         variant: "destructive" 
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Overlay */}
//       <div 
//         className="absolute inset-0 bg-background/80 backdrop-blur-md"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden animate-slide-up">
//         {/* Decorative */}
//         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
//         <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-green/20 rounded-full blur-[80px]" />

//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors z-10"
//         >
//           <X className="w-5 h-5" />
//         </button>

//         {/* Content */}
//         <div className="relative p-8">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan mb-4">
//               <Wallet className="w-8 h-8 text-primary-foreground" />
//             </div>
//             <h2 className="font-display text-2xl font-bold text-foreground">
//               Nạp tiền
//             </h2>
//             <p className="text-muted-foreground mt-2">
//               Chọn gói nạp để tiếp tục
//             </p>
//           </div>

//          {/* Current Balance */}
//           <div className="glass-card p-4 rounded-xl mb-6 text-center border border-border/50">
//             <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
//             <p className="font-display text-3xl font-bold text-primary mt-1">
//               {balance.toLocaleString('vi-VN')}đ
//             </p>
//           </div>

//           {/* Amount Selection */}
//           <div className="mb-6">
//             <p className="text-sm font-medium text-foreground mb-3">Chọn gói nạp</p>
//             <div className="grid grid-cols-3 gap-3">
//               {topUpOptions.map((option) => (
//                 <button
//                   key={option.amount}
//                   onClick={() => setSelectedAmount(option.amount)}
//                   className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
//                     selectedAmount === option.amount
//                       ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
//                       : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
//                   }`}
//                 >
//                   {option.popular && (
//                     <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground z-10 shadow-sm">
//                       HOT
//                     </span>
//                   )}
//                   {selectedAmount === option.amount && (
//                     <div className="absolute top-2 right-2">
//                       <Check className="w-4 h-4 text-primary" />
//                     </div>
//                   )}
//                   <p className="font-display font-bold text-foreground text-center">{option.label}</p>
//                   {option.bonus > 0 && (
//                     <p className="text-xs text-neon-green flex items-center justify-center gap-1 mt-1">
//                       <Sparkles className="w-3 h-3" />
//                       +{option.bonus}%
//                     </p>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Summary */}
//           {selectedAmount && selectedOption && (
//             <div className="glass-card p-4 rounded-xl mb-6 border border-border/50">
//               <div className="flex justify-between text-sm mb-2">
//                 <span className="text-muted-foreground">Số tiền nạp</span>
//                 <span className="text-foreground">{selectedOption.label}</span>
//               </div>
//               {selectedOption.bonus > 0 && (
//                 <div className="flex justify-between text-sm mb-2">
//                   <span className="text-muted-foreground">Khuyến mãi ({selectedOption.bonus}%)</span>
//                   <span className="text-neon-green">+{(selectedAmount * selectedOption.bonus / 100).toLocaleString('vi-VN')}đ</span>
//                 </div>
//               )}
//               <div className="border-t border-border/50 my-2" />
//               <div className="flex justify-between font-semibold items-center">
//                 <span className="text-foreground">Tổng nhận được</span>
//                 <span className="text-primary font-display text-lg">
//                   {(selectedAmount + selectedAmount * (selectedOption.bonus || 0) / 100).toLocaleString('vi-VN')}đ
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Submit Button */}
//           <Button 
//             variant="gaming" 
//             size="lg" 
//             className="w-full relative overflow-hidden"
//             disabled={!selectedAmount || isLoading}
//             onClick={handleTopUp}
//           >
//             {isLoading ? (
//               <>
//                 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//                 Đang kết nối VNPay...
//               </>
//             ) : (
//               <>
//                 <CreditCard className="w-5 h-5 mr-2" />
//                 Thanh toán qua VNPay
//               </>
//             )}
//           </Button>

//           {/* Note */}
//           <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
//             <span>🔒</span> Giao dịch được bảo mật bởi SSL 256-bit
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WalletModal;