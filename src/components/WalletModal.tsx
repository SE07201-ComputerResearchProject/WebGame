import { useState } from "react";
import { X, Wallet, CreditCard, Smartphone, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const topUpOptions = [
  { amount: 20000, bonus: 0, label: "20.000đ" },
  { amount: 50000, bonus: 5, label: "50.000đ" },
  { amount: 100000, bonus: 10, label: "100.000đ" },
  { amount: 200000, bonus: 15, label: "200.000đ" },
  { amount: 500000, bonus: 20, label: "500.000đ" },
  { amount: 1000000, bonus: 25, label: "1.000.000đ", popular: true },
];

const paymentMethods = [
  { id: "momo", name: "MoMo", icon: "💜" },
  { id: "zalopay", name: "ZaloPay", icon: "💙" },
  { id: "vnpay", name: "VNPay", icon: "🔵" },
  { id: "card", name: "Thẻ ngân hàng", icon: "💳" },
];

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  if (!isOpen) return null;

  const selectedOption = topUpOptions.find(opt => opt.amount === selectedAmount);

  const handleTopUp = () => {
    if (!selectedAmount || !selectedPayment) return;
    // TODO: Implement payment with Stripe sandbox
    console.log("Processing payment:", { amount: selectedAmount, method: selectedPayment });
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
              Chọn gói nạp và phương thức thanh toán
            </p>
          </div>

         {/* Current Balance */}
          <div className="glass-card p-4 rounded-xl mb-6 text-center">
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
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedAmount === option.amount
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  {option.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent text-accent-foreground">
                      HOT
                    </span>
                  )}
                  {selectedAmount === option.amount && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <p className="font-display font-bold text-foreground">{option.label}</p>
                  {option.bonus > 0 && (
                    <p className="text-xs text-neon-green flex items-center justify-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3" />
                      +{option.bonus}% bonus
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Phương thức thanh toán</p>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selectedPayment === method.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-foreground">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedAmount && selectedOption && (
            <div className="glass-card p-4 rounded-xl mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="text-foreground">{selectedOption.label}</span>
              </div>
              {selectedOption.bonus > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Bonus ({selectedOption.bonus}%)</span>
                  <span className="text-neon-green">+{(selectedAmount * selectedOption.bonus / 100).toLocaleString()}đ</span>
                </div>
              )}
              <div className="border-t border-border/50 my-2" />
              <div className="flex justify-between font-semibold">
                <span className="text-foreground">Tổng nhận được</span>
                <span className="text-primary font-display">
                  {(selectedAmount + selectedAmount * (selectedOption.bonus || 0) / 100).toLocaleString()}đ
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            variant="gaming" 
            size="lg" 
            className="w-full"
            disabled={!selectedAmount || !selectedPayment}
            onClick={handleTopUp}
          >
            <CreditCard className="w-5 h-5" />
            Thanh toán ngay
          </Button>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Giao dịch được bảo mật bởi SSL 256-bit
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
