import { useState, useEffect } from "react";
import { X, ShieldCheck, Smartphone, ShieldAlert, Loader2, MessageSquare, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface MfaSetupModalProps { isOpen: boolean; onClose: () => void; }

const MfaSetupModal = ({ isOpen, onClose }: MfaSetupModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [mfaType, setMfaType] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [setupMode, setSetupMode] = useState<"select" | "app" | "sms">("select");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [phone, setPhone] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [smsStep, setSmsStep] = useState<"phone" | "otp">("phone");
  const [verifyCode, setVerifyCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.getMfaStatus();
      if (res?.enabled) { setIsEnabled(true); setMfaType(res.type); setRegisteredPhone(res.phone || ""); } 
      else setIsEnabled(false);
    } catch (e) { toast({ title: "Lỗi", description: "Lỗi trạng thái MFA" }); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (isOpen) { setIsLoading(true); setIsSuccess(false); setSetupMode("select"); setSmsStep("phone"); setVerifyCode(""); setPhone(""); fetchStatus(); }
  }, [isOpen]);

// Khởi tạo Firebase reCAPTCHA có cơ chế dọn dẹp (Cleanup)
  useEffect(() => {
    if (isOpen) {
      // Delay 100ms để đảm bảo React đã vẽ xong thẻ div vào HTML
      setTimeout(() => {
        if (!(window as any).recaptchaSetup) {
          (window as any).recaptchaSetup = new RecaptchaVerifier(auth, 'recaptcha-setup', { size: 'invisible' });
        }
      }, 100);
    }

    // Dọn rác khi đóng Modal, tránh lỗi Cannot read properties of null
    return () => {
      if (!isOpen && (window as any).recaptchaSetup) {
        try {
          (window as any).recaptchaSetup.clear();
          (window as any).recaptchaSetup = null;
        } catch (e) {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectApp = async () => {
    setSetupMode("app");
    try {
      const res = await api.setupMfa();
      if (res?.ok) { setQrCodeUrl(res.qrCodeUrl); setSecret(res.secret); }
    } catch (e) { toast({ title: "Lỗi", description: "Không tạo được QR" }); }
  };

  const triggerFirebaseSms = async (targetPhone: string) => {
    let fmtPhone = targetPhone.trim();
    if (fmtPhone.startsWith('0')) fmtPhone = '+84' + fmtPhone.slice(1);
    else if (!fmtPhone.startsWith('+')) fmtPhone = '+' + fmtPhone;

    try {
      const confirmation = await signInWithPhoneNumber(auth, fmtPhone, (window as any).recaptchaSetup);
      setConfirmationResult(confirmation);
      toast({ title: "Thành công", description: "Mã OTP đã gửi qua Firebase!" });
      return true;
    } catch (e) {
      toast({ title: "Lỗi", description: "Gửi SMS Firebase thất bại", variant: "destructive" });
      return false;
    }
  };

  const handleSendPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) return toast({ title: "Lỗi", description: "SĐT không hợp lệ" });
    const success = await triggerFirebaseSms(phone);
    if (success) setSmsStep("otp");
  };

  const requestDisableCode = async () => {
    if (!registeredPhone) return toast({ title: "Lỗi", description: "Không tìm thấy SĐT" });
    await triggerFirebaseSms(registeredPhone);
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (setupMode === "sms") {
        await confirmationResult.confirm(verifyCode); // Xác nhận Firebase
        const res = await api.enableSmsMfa({ phone, code: "firebase_ok" });
        if (res?.ok) { setIsSuccess(true); setIsEnabled(true); toast({ title: "Thành công", description: res.message }); }
      } else {
        const res = await api.enableMfa({ code: verifyCode });
        if (res?.ok) { setIsSuccess(true); setIsEnabled(true); toast({ title: "Thành công", description: res.message }); }
      }
    } catch (err) { toast({ title: "Lỗi", description: "Mã xác thực không đúng", variant: "destructive" }); }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mfaType === 'sms' && confirmationResult) await confirmationResult.confirm(verifyCode);
      const res = await api.disableMfa({ code: mfaType === 'sms' ? "firebase_ok" : verifyCode });
      if (res?.ok) { toast({ title: "Thành công", description: "Đã tắt MFA" }); setIsEnabled(false); setSetupMode("select"); setVerifyCode(""); setPhone(""); }
    } catch (err) { toast({ title: "Lỗi", description: "Mã không đúng", variant: "destructive" }); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        <div id="recaptcha-setup"></div> {/* Vùng chứa reCAPTCHA tàng hình */}

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : isSuccess ? (
          <div className="text-center animate-fade-in"><ShieldCheck className="w-16 h-16 text-neon-green mx-auto mb-4" /><h2 className="text-2xl font-bold mb-4">Thành công!</h2><Button variant="gaming" className="w-full" onClick={onClose}>Đóng</Button></div>
        ) : isEnabled ? (
          <div className="text-center animate-fade-in">
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Quản lý MFA</h2>
            <form onSubmit={handleDisable} className="space-y-4">
              <input type="text" maxLength={6} placeholder="Nhập 6 số..." value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-destructive/30 text-destructive" />
              <Button variant="destructive" className="w-full" type="submit" disabled={verifyCode.length !== 6}>Tắt bảo mật MFA</Button>
            </form>
            {mfaType === 'sms' && <button onClick={requestDisableCode} type="button" className="text-xs text-primary mt-4 hover:underline">Gửi mã xác nhận qua SMS</button>}
          </div>
        ) : setupMode === "select" ? (
          <div className="text-center animate-fade-in">
            <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" /><h2 className="text-2xl font-bold mb-6">Chọn cách bảo vệ</h2>
            <div className="space-y-3">
              <button onClick={handleSelectApp} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 text-left"><QrCode className="w-6 h-6 text-primary" /><div><p className="font-bold">App xác thực</p></div></button>
              <button onClick={() => setSetupMode("sms")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 text-left"><MessageSquare className="w-6 h-6 text-neon-green" /><div><p className="font-bold">Tin nhắn SMS</p></div></button>
            </div>
          </div>
        ) : setupMode === "sms" ? (
          <div className="text-center animate-fade-in">
            <MessageSquare className="w-16 h-16 text-neon-green mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Xác thực SMS Firebase</h2>
            {smsStep === "phone" ? (
              <form onSubmit={handleSendPhone} className="space-y-4 mt-6">
                <input type="text" placeholder="Số điện thoại..." value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" />
                <Button variant="gaming" className="w-full" type="submit" disabled={phone.length < 9}>Gửi mã OTP</Button>
              </form>
            ) : (
              <form onSubmit={handleEnable} className="space-y-4 mt-6">
                <input type="text" maxLength={6} placeholder="000000" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" />
                <Button variant="gaming" className="w-full" type="submit" disabled={verifyCode.length !== 6}>Xác nhận</Button>
                <button type="button" onClick={() => setSmsStep("phone")} className="text-xs mt-2">Đổi số</button>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Google Auth</h2>
            {qrCodeUrl && <img src={qrCodeUrl} className="w-40 h-40 mx-auto my-4 bg-white p-2 rounded-xl" />}
            <form onSubmit={handleEnable} className="space-y-4"><input type="text" maxLength={6} placeholder="Nhập 6 số..." value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="w-full h-12 text-center text-xl tracking-widest rounded-xl bg-muted/50 border border-border/50" /><Button variant="gaming" className="w-full" type="submit" disabled={verifyCode.length !== 6}>Kích hoạt</Button></form>
          </div>
        )}
      </div>
    </div>
  );
};
export default MfaSetupModal;