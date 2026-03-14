import { useState, useRef, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Gamepad2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import auth from "@/lib/auth";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// ===== IMPORT FIREBASE =====
import { auth as firebaseAuth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

// Khai báo biến toàn cục cho reCAPTCHA của Firebase
declare global {
  interface Window {
    recaptchaVerifierLogin: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // State cho MFA
  const [mfaStep, setMfaStep] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaType, setMfaType] = useState<string>("app"); 
  const [phoneMask, setPhoneMask] = useState<string>("");
  
  // State giữ phiên Firebase SMS
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const [formData, setFormData] = useState({ email: "", password: "", username: "", confirmPassword: "" });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Dọn dẹp reCAPTCHA khi đóng Modal
  useEffect(() => {
    if (!isOpen) {
      if (window.recaptchaVerifierLogin) {
        window.recaptchaVerifierLogin.clear();
        window.recaptchaVerifierLogin = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // HÀM GỬI SMS TỰ ĐỘNG BẰNG FIREBASE
  const sendFirebaseSMS = async (phoneNumber: string) => {
    try {
      if (!window.recaptchaVerifierLogin) {
        window.recaptchaVerifierLogin = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container-login', { size: 'invisible' });
      }
      // Chuẩn hóa số điện thoại +84
      let formattedPhone = phoneNumber.trim();
      if (formattedPhone.startsWith('0')) formattedPhone = '+84' + formattedPhone.slice(1);
      if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;

      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, window.recaptchaVerifierLogin);
      setConfirmationResult(confirmation);
      toast({ title: "Đã gửi SMS", description: "Firebase đang gửi mã OTP đến điện thoại của bạn." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Lỗi SMS", description: "Không thể gửi SMS. Hãy thử F5 lại trang.", variant: "destructive" });
    }
  };

  // Xử lý nộp mã 6 số MFA
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) return toast({ title: "Lỗi", description: "Vui lòng nhập đủ 6 số xác thực" });
    
    try {
      let firebaseToken = undefined;

      // NẾU LÀ SMS -> Xác minh với Firebase trước để lấy Token
      if (mfaType === 'sms') {
        if (!confirmationResult) return toast({ title: "Lỗi", description: "Hệ thống đang chuẩn bị, vui lòng đợi..." });
        try {
          const result = await confirmationResult.confirm(mfaCode);
          firebaseToken = await result.user.getIdToken(); // Đổi OTP lấy Căn cước Firebase
        } catch (fbError) {
          return toast({ title: "Lỗi", description: "Mã OTP Firebase không đúng hoặc đã hết hạn!", variant: "destructive" });
        }
      }

      // Gửi xuống Backend
      const res = await api.verifyMfaLogin({ tempToken, code: mfaCode, firebaseToken });
      if (res?.ok) {
        auth.setToken(res.token);
        auth.setUser(res.user);
        toast({ title: "Đăng nhập thành công", description: `Xin chào ${res.user.username}` });
        onClose();
        setMfaStep(false); setMfaCode("");
      } else {
        toast({ title: "Lỗi", description: res?.error || "Mã xác thực Backend từ chối" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const res = await api.googleLogin(credential);
      if (res?.mfaRequired) {
        setTempToken(res.tempToken); setMfaType(res.mfaType); setMfaStep(true); 
        if (res.mfaType === 'sms') {
          setPhoneMask(res.phone);
          sendFirebaseSMS(res.phone); // Gọi Firebase gửi SMS
        }
        toast({ title: "Xác thực bảo mật", description: res.message });
      } else if (res?.ok) {
        auth.setToken(res.token); auth.setUser(res.user);
        toast({ title: "Thành công", description: `Xin chào ${res.user.username}` });
        onClose();
      } else {
        toast({ title: "Lỗi", description: res?.error || "Đăng nhập Google thất bại" });
      }
    } catch (e) { toast({ title: "Lỗi", description: "Lỗi kết nối tới server" }); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) return toast({ title: "Cảnh báo", description: "Vui lòng xác nhận bạn không phải người máy!", variant: "destructive" });
    if (mode === "register" && formData.password !== formData.confirmPassword) return toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp" });

    (async () => {
      try {
        if (mode === "register") {
          const res = await api.register({ username: formData.username, email: formData.email, password: formData.password, captchaToken });
          if (res?.ok) {
            auth.setToken(res.token); auth.setUser(res.user);
            toast({ title: "Đăng ký thành công", description: `Xin chào ${res.user.username}` });
            onClose();
          } else {
            toast({ title: "Lỗi", description: res?.error || "Không thể đăng ký" });
            recaptchaRef.current?.reset(); setCaptchaToken(null);
          }
        } else {
          const res = await api.login({ email: formData.email, password: formData.password, captchaToken });
          if (res?.mfaRequired) {
            setTempToken(res.tempToken); setMfaType(res.mfaType); setMfaStep(true); 
            if (res.mfaType === 'sms') {
              setPhoneMask(res.phone);
              sendFirebaseSMS(res.phone); // Gọi Firebase gửi SMS
            }
            toast({ title: "Xác thực bảo mật", description: res.message });
          } else if (res?.ok) {
            auth.setToken(res.token); auth.setUser(res.user);
            toast({ title: "Đăng nhập thành công", description: `Xin chào ${res.user.username}` });
            onClose();
          } else {
            toast({ title: "Lỗi", description: res?.error || "Đăng nhập thất bại" });
            recaptchaRef.current?.reset(); setCaptchaToken(null);
          }
        }
      } catch (err) {
        toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
        recaptchaRef.current?.reset(); setCaptchaToken(null);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* VÙNG CHỨA RECAPTCHA ẨN CỦA FIREBASE */}
      <div id="recaptcha-container-login"></div>

      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors z-10"><X className="w-5 h-5" /></button>

       <div className="relative p-8">
         {mfaStep ? (
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4 border border-primary/50"><ShieldCheck className="w-8 h-8 text-primary" /></div>
               <h2 className="font-display text-2xl font-bold text-foreground">Bảo mật 2 lớp</h2>
               <p className="text-muted-foreground mt-2 text-sm">
                 {mfaType === 'sms' ? `Vui lòng nhập mã OTP 6 số vừa được gửi tới điện thoại: ${phoneMask}` : `Mở ứng dụng Google Authenticator để lấy mã 6 số.`}
               </p>
             </div>
             <form onSubmit={handleMfaSubmit} className="space-y-4">
               <input type="text" maxLength={6} placeholder="000000" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} className="w-full h-14 text-center tracking-[0.5em] text-2xl font-bold rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" required />
               <Button variant="gaming" size="lg" className="w-full" type="submit">Xác nhận</Button>
               <button type="button" onClick={() => setMfaStep(false)} className="w-full text-sm text-muted-foreground hover:text-foreground mt-2">Quay lại đăng nhập</button>
             </form>
           </div>
         ) : (
           /* Form đăng nhập cũ giữ nguyên không đổi CSS */
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gaming mb-4"><Gamepad2 className="w-8 h-8 text-primary-foreground" /></div>
               <h2 className="font-display text-2xl font-bold text-foreground">{mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}</h2>
               <p className="text-muted-foreground mt-2">{mode === "login" ? "Đăng nhập để tiếp tục hành trình gaming" : "Tham gia cộng đồng game thủ lớn nhất"}</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
               {mode === "register" && (
                 <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="text" placeholder="Tên người dùng" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all" required /></div>
               )}
               <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all" required /></div>
               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all" required />
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

             <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-border/50" /><span className="text-sm text-muted-foreground">hoặc</span><div className="flex-1 h-px bg-border/50" /></div>
             <div className="flex justify-center">
               {googleClientId ? (
                 <GoogleOAuthProvider clientId={googleClientId}>
                   <GoogleLogin onSuccess={(res) => { if (res.credential) handleGoogleSuccess(res.credential); }} onError={() => toast({ title: "Lỗi", description: "Không thể kết nối Google" })} useOneTap theme="filled_black" shape="pill" />
                 </GoogleOAuthProvider>
               ) : <div className="text-xs text-destructive">Thiếu VITE_GOOGLE_CLIENT_ID</div>}
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