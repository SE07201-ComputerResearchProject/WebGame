import { useState, useEffect } from "react";
import { X, ShieldCheck, Smartphone, ShieldAlert, Trash2, Loader2, MessageSquare, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MfaSetupModal = ({ isOpen, onClose }: MfaSetupModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [mfaType, setMfaType] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Trạng thái cho Cài đặt
  const [setupMode, setSetupMode] = useState<"select" | "app" | "sms">("select");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [phone, setPhone] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "otp">("phone");
  const [verifyCode, setVerifyCode] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await api.getMfaStatus();
      if (res?.enabled) {
        setIsEnabled(true);
        setMfaType(res.type);
      } else {
        setIsEnabled(false);
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể lấy trạng thái MFA" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIsSuccess(false);
      setSetupMode("select"); // <--- LUÔN RESET VỀ MÀN HÌNH CHỌN 2 NÚT BẤM
      setSmsStep("phone");
      setVerifyCode("");
      setPhone("");
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lấy QR Code cho App
  const handleSelectApp = async () => {
    setSetupMode("app");
    try {
      const res = await api.setupMfa();
      if (res?.ok) {
        setQrCodeUrl(res.qrCodeUrl);
        setSecret(res.secret);
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể tạo QR Code" });
    }
  };

  // Gửi số điện thoại cho SMS
  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast({ title: "Lỗi", description: "Số điện thoại không hợp lệ" });
    try {
      const res = await api.setupSmsMfa({ phone });
      if (res?.ok) {
        toast({ title: "Thành công", description: "Mã OTP đã được gửi!" });
        setSmsStep("otp");
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Lỗi gửi SMS" });
    }
  };

  // Kích hoạt MFA (Chung cho App và SMS)
  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = setupMode === "app" 
        ? await api.enableMfa({ code: verifyCode })
        : await api.enableSmsMfa({ code: verifyCode });

      if (res?.ok) {
        setIsSuccess(true);
        setIsEnabled(true);
        toast({ title: "Thành công", description: res.message });
      } else {
        toast({ title: "Lỗi", description: res?.error || "Mã không đúng", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Lỗi kết nối" });
    }
  };

  // Tắt MFA
  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.disableMfa({ code: verifyCode });
      if (res?.ok) {
        toast({ title: "Thành công", description: "Đã tắt bảo mật 2 lớp" });
        setIsEnabled(false);
        setSetupMode("select");
        setVerifyCode("");
      } else {
        toast({ title: "Lỗi", description: res?.error || "Mã không đúng", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Lỗi kết nối" });
    }
  };

  // Gửi lại mã để tắt SMS MFA
  const requestDisableCode = async () => {
    try {
      const res = await api.requestDisableSms();
      if (res?.ok) toast({ title: "Đã gửi", description: "Vui lòng kiểm tra tin nhắn" });
    } catch (e) {
      toast({ title: "Lỗi", description: "Không thể gửi mã" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          </div>
        ) : isSuccess ? (
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-green/20 mb-6 border-2 border-neon-green">
              <ShieldCheck className="w-10 h-10 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Bảo mật thành công!</h2>
            <Button variant="gaming" className="w-full mt-4" onClick={onClose}>Đóng cửa sổ</Button>
          </div>
        ) : isEnabled ? (
          /* ================= GIAO DIỆN TẮT MFA ================= */
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/20 mb-4 border border-destructive/50">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Quản lý Bảo mật</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn đang dùng {mfaType === 'sms' ? "Tin nhắn SMS" : "Google Auth"}. Nhập mã 6 số để tắt.
            </p>

            <form onSubmit={handleDisable} className="space-y-4">
              <input
                type="text" maxLength={6} placeholder="Nhập 6 số..." value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-destructive/30 focus:ring-2 focus:ring-destructive/50 text-destructive font-bold"
              />
              <Button variant="destructive" className="w-full" type="submit" disabled={verifyCode.length !== 6}>
                <Trash2 className="w-4 h-4 mr-2" /> Tắt bảo mật MFA
              </Button>
            </form>
            {mfaType === 'sms' && (
              <button onClick={requestDisableCode} className="text-xs text-primary mt-4 hover:underline">
                Gửi mã xác nhận về điện thoại
              </button>
            )}
          </div>
        ) : setupMode === "select" ? (
          /* ================= GIAO DIỆN CHỌN PHƯƠNG THỨC ================= */
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Chọn cách bảo vệ</h2>
            <p className="text-sm text-muted-foreground mb-6">Bảo vệ tài khoản của bạn khỏi hacker.</p>
            
            <div className="space-y-3">
              <button onClick={handleSelectApp} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all text-left group">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><QrCode className="w-6 h-6" /></div>
                <div><p className="font-bold text-foreground">Ứng dụng xác thực</p><p className="text-xs text-muted-foreground">Google Authenticator, Authy...</p></div>
              </button>
              
              <button onClick={() => setSetupMode("sms")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all text-left group">
                <div className="p-3 rounded-lg bg-neon-green/10 text-neon-green group-hover:bg-neon-green group-hover:text-background transition-colors"><MessageSquare className="w-6 h-6" /></div>
                <div><p className="font-bold text-foreground">Tin nhắn SMS</p><p className="text-xs text-muted-foreground">Nhận mã OTP qua số điện thoại</p></div>
              </button>
            </div>
          </div>
        ) : setupMode === "sms" ? (
          /* ================= GIAO DIỆN SETUP SMS ================= */
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-green/20 mb-4">
              <MessageSquare className="w-8 h-8 text-neon-green" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Xác thực qua SMS</h2>
            
            {smsStep === "phone" ? (
              <form onSubmit={handleSendPhone} className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground mb-4">Nhập số điện thoại để nhận mã xác nhận.</p>
                <input type="text" placeholder="Ví dụ: 0987654321" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" />
                <Button variant="gaming" className="w-full" type="submit" disabled={phone.length < 10}>Gửi mã OTP</Button>
                <button type="button" onClick={() => setSetupMode("select")} className="text-xs text-muted-foreground hover:text-foreground mt-2">Quay lại</button>
              </form>
            ) : (
              <form onSubmit={handleEnable} className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground mb-4">Mã 6 số đã được gửi tới <strong>{phone}</strong></p>
                <input type="text" maxLength={6} placeholder="000000" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" />
                <Button variant="gaming" className="w-full" type="submit" disabled={verifyCode.length !== 6}>Xác nhận</Button>
                <button type="button" onClick={() => setSmsStep("phone")} className="text-xs text-muted-foreground hover:text-foreground mt-2">Đổi số điện thoại</button>
              </form>
            )}
          </div>
        ) : (
          /* ================= GIAO DIỆN SETUP APP ================= */
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4"><Smartphone className="w-8 h-8 text-primary" /></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Cài đặt Google Auth</h2>
            {qrCodeUrl ? (<div className="flex justify-center my-4"><div className="bg-white p-2 rounded-xl border-2 border-primary/50"><img src={qrCodeUrl} className="w-40 h-40" /></div></div>) : (<div className="w-40 h-40 mx-auto bg-muted/50 rounded-xl my-4 animate-pulse" />)}
            <form onSubmit={handleEnable} className="space-y-4">
              <input type="text" maxLength={6} placeholder="Nhập 6 số..." value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-border/50" />
              <Button variant="gaming" className="w-full" type="submit" disabled={verifyCode.length !== 6}>Kích hoạt</Button>
              <button type="button" onClick={() => setSetupMode("select")} className="text-xs text-muted-foreground hover:text-foreground mt-2">Quay lại</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default MfaSetupModal;