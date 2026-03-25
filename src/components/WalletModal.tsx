import { useState, useEffect } from "react";
import { X, Wallet, CreditCard, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import authStore from "@/lib/auth";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const topUpOptions = [
  { amount: 10000, bonus: 0, label: "10.000đ" },
  { amount: 50000, bonus: 5, label: "50.000đ" },
  { amount: 100000, bonus: 10, label: "100.000đ" },
  { amount: 200000, bonus: 15, label: "200.000đ" },
  { amount: 500000, bonus: 20, label: "500.000đ" },
  { amount: 1000000, bonus: 25, label: "1.000.000đ", popular: true },
];

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
    const fetchFreshBalance = async () => {
      // Chỉ gọi API khi Modal đang được mở ra
      if (isOpen) {
        try {
          // Gọi API lấy dữ liệu mới nhất từ CSDL
          const res = await api.getMe(); 
          
          if (res?.ok && res.user) {
            // 1. Cập nhật số dư hiển thị ngay trên màn hình nạp tiền
            setBalance(res.user.balance);
            
            // 2. Cập nhật lại kho lưu trữ toàn cục (authStore) 
            // Để Header, Profile hay chỗ nào hiển thị tiền cũng tự động nhảy số theo
            authStore.setUser(res.user); 
          }
        } catch (error) {
          console.error("Lấy số dư thất bại, dùng tạm số dư cũ", error);
          // Nếu mạng lag, dùng tạm số tiền đang lưu trong máy
          const cachedUser = authStore.getUser();
          setBalance(cachedUser?.balance || 0);
        }
      }
    };

    fetchFreshBalance();
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOption = topUpOptions.find(opt => opt.amount === selectedAmount);

  const handleTopUp = async () => {
    if (!selectedAmount) return;

    setIsLoading(true);
    try {
      const res = await api.createVnPayUrl({ amount: selectedAmount });
      
      if (res?.ok && res.url) {
        window.location.href = res.url;
      } else {
        toast({ 
          title: "Lỗi thanh toán", 
          description: res?.error || "Không thể tạo mã giao dịch. Vui lòng thử lại sau.", 
          variant: "destructive" 
        });
      }
    } catch (e) {
      toast({ 
        title: "Mất kết nối", 
        description: "Không thể kết nối đến máy chủ thanh toán.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden animate-slide-up">
        {/* Decorative */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-green/20 rounded-full blur-[80px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-green to-neon-cyan mb-4">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Nạp tiền
            </h2>
            <p className="text-muted-foreground mt-2">
              Chọn gói nạp để tiếp tục
            </p>
          </div>

         {/* Current Balance */}
          <div className="glass-card p-4 rounded-xl mb-6 text-center border border-border/50">
            <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
            <p className="font-display text-3xl font-bold text-primary mt-1">
              {balance.toLocaleString('vi-VN')}đ
            </p>
          </div>

          {/* Amount Selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Chọn gói nạp</p>
            <div className="grid grid-cols-3 gap-3">
              {topUpOptions.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                    selectedAmount === option.amount
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  {option.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground z-10 shadow-sm">
                      HOT
                    </span>
                  )}
                  {selectedAmount === option.amount && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <p className="font-display font-bold text-foreground text-center">{option.label}</p>
                  {option.bonus > 0 && (
                    <p className="text-xs text-neon-green flex items-center justify-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3" />
                      +{option.bonus}%
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedAmount && selectedOption && (
            <div className="glass-card p-4 rounded-xl mb-6 border border-border/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="text-foreground">{selectedOption.label}</span>
              </div>
              {selectedOption.bonus > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Khuyến mãi ({selectedOption.bonus}%)</span>
                  <span className="text-neon-green">+{(selectedAmount * selectedOption.bonus / 100).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="border-t border-border/50 my-2" />
              <div className="flex justify-between font-semibold items-center">
                <span className="text-foreground">Tổng nhận được</span>
                <span className="text-primary font-display text-lg">
                  {(selectedAmount + selectedAmount * (selectedOption.bonus || 0) / 100).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            variant="gaming" 
            size="lg" 
            className="w-full relative overflow-hidden"
            disabled={!selectedAmount || isLoading}
            onClick={handleTopUp}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang kết nối VNPay...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Thanh toán qua VNPay
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
            <span>🔒</span> Giao dịch được bảo mật bởi SSL 256-bit
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;