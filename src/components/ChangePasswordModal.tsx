import { useState } from "react";
import { X, Lock, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword.length < 6) {
      return setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp.");
    }

    try {
      const res = await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res?.ok) {
        toast({ title: "Thành công", description: res.message });
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear form
        onClose(); // Đóng modal
      } else {
        setError(res?.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4 border border-primary/50">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Đổi mật khẩu</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu hiện tại" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type={showPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu mới" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all" required />
            </div>

            {error && <p className="text-destructive text-sm text-center font-medium">{error}</p>}

            <Button variant="gaming" size="lg" className="w-full mt-2" type="submit">Cập nhật mật khẩu</Button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ChangePasswordModal;