import { useState, useRef, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Gamepad2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import authStore from "@/lib/auth";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthModalProps { isOpen: boolean; onClose: () => void; }

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [mfaStep, setMfaStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaType, setMfaType] = useState<string>("app"); 
  const [phoneMask, setPhoneMask] = useState<string>("");
  const [registeredPhone, setRegisteredPhone] = useState<string>("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const [formData, setFormData] = useState({ email: "", password: "", username: "", confirmPassword: "" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const triggerFirebaseSms = async (phoneToUse: string) => {
    let fmtPhone = phoneToUse.trim();
    if (fmtPhone.startsWith('0')) fmtPhone = '+84' + fmtPhone.slice(1);
    else if (!fmtPhone.startsWith('+')) fmtPhone = '+' + fmtPhone;

    try {
      const confirmation = await signInWithPhoneNumber(auth, fmtPhone, (window as any).recaptchaLogin);
      setConfirmationResult(confirmation);
    } catch (e) { 
      toast({ title: "Lỗi", description: "Firebase SMS thất bại", variant: "destructive" }); 
    }
  };

  // Khởi tạo reCAPTCHA Firebase và gọi gửi SMS
  useEffect(() => {
    if (mfaStep && mfaType === 'sms') {
      setTimeout(() => {
        if (!(window as any).recaptchaLogin) {
          (window as any).recaptchaLogin = new RecaptchaVerifier(auth, 'recaptcha-login', { size: 'invisible' });
        }
        // Gọi gửi tin nhắn ngay lập tức nếu chưa gửi
        if (registeredPhone && !confirmationResult) {
          triggerFirebaseSms(registeredPhone);
        }
      }, 100);
    }

    // Cleanup: Xóa instance cũ khi thoát bước MFA
    return () => {
      if (!mfaStep && (window as any).recaptchaLogin) {
        try {
          (window as any).recaptchaLogin.clear();
          (window as any).recaptchaLogin = null;
        } catch (e) {}
      }
    };
  }, [mfaStep, mfaType, registeredPhone]); 
  // Lưu ý: Không để confirmationResult vào mảng [] ở trên để tránh vòng lặp

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) return toast({ title: "Lỗi", description: "Vui lòng nhập đủ 6 số xác thực" });
    try {
      if (mfaType === 'sms') await confirmationResult.confirm(mfaCode); 

      const res = await api.verifyMfaLogin({ tempToken, code: mfaType === 'sms' ? "firebase_ok" : mfaCode });
      if (res?.ok) {
        authStore.setToken(res.token); authStore.setUser(res.user);
        toast({ title: "Đăng nhập thành công", description: `Xin chào ${res.user.username}` });
        onClose(); setMfaStep(false); setMfaCode("");
      } else toast({ title: "Lỗi", description: res?.error || "Mã xác thực không đúng" });
    } catch (err) { toast({ title: "Lỗi", description: "Mã OTP Firebase không hợp lệ" }); }
  };

  const processLoginSuccess = (res: any) => {
    if (res?.mfaRequired) {
      setTempToken(res.tempToken); setMfaType(res.mfaType); setMfaStep(true); 
      if (res.mfaType === 'sms') {
        setPhoneMask(res.phoneMask);
        setRegisteredPhone(res.phone); 
        toast({ title: "Xác thực bảo mật", description: "Đang yêu cầu Firebase gửi OTP..." });
      } else { toast({ title: "Xác thực bảo mật", description: res.message }); }
    } else if (res?.ok) {
      authStore.setToken(res.token); authStore.setUser(res.user);
      toast({ title: "Thành công", description: `Xin chào ${res.user.username}` });
      onClose();
    } else { toast({ title: "Lỗi", description: res?.error || "Đăng nhập thất bại" }); recaptchaRef.current?.reset(); setCaptchaToken(null); }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const res = await api.googleLogin(credential);
      processLoginSuccess(res);
    } catch (e) { toast({ title: "Lỗi", description: "Lỗi kết nối tới server" }); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) return toast({ title: "Cảnh báo", description: "Xác nhận reCAPTCHA!", variant: "destructive" });
    if (mode === "register" && formData.password !== formData.confirmPassword) return toast({ title: "Lỗi", description: "Mật khẩu không khớp" });

    (async () => {
      try {
        const res = mode === "register" 
          ? await api.register({ username: formData.username, email: formData.email, password: formData.password, captchaToken })
          : await api.login({ email: formData.email, password: formData.password, captchaToken });
        processLoginSuccess(res);
      } catch (err) { toast({ title: "Lỗi", description: "Lỗi kết nối server" }); recaptchaRef.current?.reset(); setCaptchaToken(null); }
    })();
  };

  // ✅ Lệnh return sớm được chuyển xuống đây, đảm bảo trật tự Hooks không bao giờ bị phá vỡ!
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground z-10"><X className="w-5 h-5" /></button>

       <div className="relative p-8">
         <div id="recaptcha-login"></div> {/* Vùng chứa reCAPTCHA tàng hình Firebase */}

         {mfaStep ? (
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4 border border-primary/50"><ShieldCheck className="w-8 h-8 text-primary" /></div>
               <h2 className="font-display text-2xl font-bold text-foreground">Bảo mật 2 lớp</h2>
               <p className="text-muted-foreground mt-2 text-sm">{mfaType === 'sms' ? `Nhập mã OTP 6 số vừa gửi tới số điện thoại: ***${phoneMask}` : `Mở ứng dụng Google Authenticator để lấy mã 6 số.`}</p>
             </div>
             <form onSubmit={handleMfaSubmit} className="space-y-4">
               <input type="text" maxLength={6} placeholder="000000" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} className="w-full h-14 text-center tracking-[0.5em] text-2xl font-bold rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" required />
               <Button variant="gaming" size="lg" className="w-full" type="submit">Xác nhận</Button>
               <button type="button" onClick={() => setMfaStep(false)} className="w-full text-sm text-muted-foreground mt-2">Quay lại</button>
             </form>
           </div>
         ) : (
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gaming mb-4"><Gamepad2 className="w-8 h-8 text-primary-foreground" /></div>
               <h2 className="font-display text-2xl font-bold text-foreground">{mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}</h2>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
               {mode === "register" && (
                 <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Tên người dùng" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all" required /></div>
               )}
               <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all" required /></div>
               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all" required />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
               </div>
               {mode === "register" && (
                 <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all" required /></div>
               )}
               <div className="flex justify-center my-4">
                 {siteKey ? <ReCAPTCHA ref={recaptchaRef} sitekey={siteKey} theme="dark" onChange={(token) => setCaptchaToken(token)} /> : <div className="text-xs text-destructive">Thiếu VITE_RECAPTCHA_SITE_KEY</div>}
               </div>
               <Button variant="gaming" size="lg" className="w-full" type="submit">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</Button>
             </form>

             <div className="flex justify-center mt-6">
               {googleClientId && (
                 <GoogleOAuthProvider clientId={googleClientId}>
                   <GoogleLogin onSuccess={(res) => { if (res.credential) handleGoogleSuccess(res.credential); }} onError={() => toast({ title: "Lỗi", description: "Không thể kết nối Google" })} theme="filled_black" shape="pill" />
                 </GoogleOAuthProvider>
               )}
             </div>
             <p className="text-center text-sm text-muted-foreground mt-6">{mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setCaptchaToken(null); }} className="text-primary hover:underline font-medium">{mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}</button></p>
           </div>
         )}
       </div>
      </div>
    </div>
  );
};
export default AuthModal;