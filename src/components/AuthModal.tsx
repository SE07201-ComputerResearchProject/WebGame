import { useState, useRef } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Gamepad2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import auth from "@/lib/auth";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

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
  
  // KHẮC PHỤC LỖI TRÙNG LẶP: Đã gộp biến gọn gàng
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });
  
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  if (!isOpen) return null;

  // Xử lý gửi mã 6 số MFA
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) {
      toast({ title: "Lỗi", description: "Vui lòng nhập đủ 6 số xác thực" });
      return;
    }
    try {
      const res = await api.verifyMfaLogin({ tempToken, code: mfaCode });
      if (res?.ok) {
        auth.setToken(res.token);
        auth.setUser(res.user);
        toast({ title: "Đăng nhập thành công", description: `Xin chào ${res.user.username}` });
        onClose();
        // Reset state
        setMfaStep(false);
        setMfaCode("");
      } else {
        toast({ title: "Lỗi", description: res?.error || "Mã xác thực không đúng" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const res = await api.googleLogin(credential);
      if (res?.mfaRequired) {
        setTempToken(res.tempToken);
        setMfaType(res.mfaType);
        if (res.mfaType === 'sms') setPhoneMask(res.phoneMask);
        setMfaStep(true); 
        toast({ title: "Xác thực bảo mật", description: res.message });
      } else if (res?.ok) {
        auth.setToken(res.token);
        auth.setUser(res.user);
        toast({ title: "Thành công", description: `Xin chào ${res.user.username}` });
        onClose();
      } else {
        toast({ title: "Lỗi", description: res?.error || "Đăng nhập Google thất bại" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    }
  };

  // Xử lý Đăng ký / Đăng nhập 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      toast({ title: "Cảnh báo", description: "Vui lòng xác nhận bạn không phải người máy!", variant: "destructive" });
      return;
    }

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp" });
      return;
    }

    (async () => {
      try {
        if (mode === "register") {
          const res = await api.register({ 
            username: formData.username, 
            email: formData.email, 
            password: formData.password,
            captchaToken 
          });
          
          if (res?.ok) {
            auth.setToken(res.token);
            auth.setUser(res.user);
            toast({ title: "Đăng ký thành công", description: `Xin chào ${res.user.username}` });
            onClose();
          } else {
            toast({ title: "Lỗi", description: res?.error || "Không thể đăng ký" });
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
          }
        } else {
          const res = await api.login({ 
            email: formData.email, 
            password: formData.password,
            captchaToken 
          });

          // NẾU TÀI KHOẢN YÊU CẦU MFA
          if (res?.mfaRequired) {
            setTempToken(res.tempToken);
            setMfaType(res.mfaType);
            if (res.mfaType === 'sms') setPhoneMask(res.phoneMask);
            setMfaStep(true); 
            toast({ title: "Xác thực bảo mật", description: res.message });
          }
          // NẾU KHÔNG CẦN MFA THÌ ĐĂNG NHẬP LUÔN
          else if (res?.ok) {
            auth.setToken(res.token);
            auth.setUser(res.user);
            toast({ title: "Đăng nhập thành công", description: `Xin chào ${res.user.username}` });
            onClose();
          } else {
            toast({ title: "Lỗi", description: res?.error || "Đăng nhập thất bại" });
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
          }
        }
      } catch (err) {
        toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gaming" />
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

       <div className="relative p-8">
         {/* MÀN HÌNH NHẬP MÃ MFA */}
         {mfaStep ? (
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4 border border-primary/50">
                 <ShieldCheck className="w-8 h-8 text-primary" />
               </div>
               <h2 className="font-display text-2xl font-bold text-foreground">Bảo mật 2 lớp</h2>
               
               <p className="text-muted-foreground mt-2 text-sm">
                 {mfaType === 'sms' 
                   ? `Vui lòng nhập mã OTP 6 số vừa được gửi tới số điện thoại kết thúc bằng ***${phoneMask}`
                   : `Mở ứng dụng Google Authenticator trên điện thoại và nhập mã 6 số để tiếp tục.`}
               </p>

             </div>
             <form onSubmit={handleMfaSubmit} className="space-y-4">
               <input
                 type="text"
                 maxLength={6}
                 placeholder="000000"
                 value={mfaCode}
                 onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                 className="w-full h-14 text-center tracking-[0.5em] text-2xl font-bold rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                 required
               />
               <Button variant="gaming" size="lg" className="w-full" type="submit">
                 Xác nhận
               </Button>
               <button type="button" onClick={() => setMfaStep(false)} className="w-full text-sm text-muted-foreground hover:text-foreground mt-2">
                 Quay lại đăng nhập
               </button>
             </form>
           </div>
         ) : (
           /* MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ CŨ */
           <div className="animate-fade-in">
             <div className="text-center mb-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gaming mb-4">
                 <Gamepad2 className="w-8 h-8 text-primary-foreground" />
               </div>
               <h2 className="font-display text-2xl font-bold text-foreground">
                 {mode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản"}
               </h2>
               <p className="text-muted-foreground mt-2">
                 {mode === "login" ? "Đăng nhập để tiếp tục hành trình gaming" : "Tham gia cộng đồng game thủ lớn nhất"}
               </p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
               {mode === "register" && (
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type="text"
                     placeholder="Tên người dùng"
                     value={formData.username}
                     onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                     className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                     required
                   />
                 </div>
               )}

               <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <input
                   type="email"
                   placeholder="Email"
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                   required
                 />
               </div>

               <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <input
                   type={showPassword ? "text" : "password"}
                   placeholder="Mật khẩu"
                   value={formData.password}
                   onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                   className="w-full h-12 pl-12 pr-12 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                   required
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>

               {mode === "register" && (
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                   <input
                     type={showPassword ? "text" : "password"}
                     placeholder="Xác nhận mật khẩu"
                     value={formData.confirmPassword}
                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                     className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:ring-2 focus:ring-primary/50 transition-all"
                     required
                   />
                 </div>
               )}

               <div className="flex justify-center my-4">
                 {siteKey ? (
                   <ReCAPTCHA ref={recaptchaRef} sitekey={siteKey} theme="dark" onChange={(token) => setCaptchaToken(token)} />
                 ) : (
                   <div className="text-xs text-destructive">Thiếu VITE_RECAPTCHA_SITE_KEY</div>
                 )}
               </div>

               <Button variant="gaming" size="lg" className="w-full" type="submit">
                 {mode === "login" ? "Đăng nhập" : "Đăng ký"}
               </Button>
             </form>

             {/* BỔ SUNG NÚT ĐĂNG NHẬP GOOGLE VÀO ĐÂY */}
             <div className="flex items-center gap-4 my-6">
               <div className="flex-1 h-px bg-border/50" />
               <span className="text-sm text-muted-foreground">hoặc</span>
               <div className="flex-1 h-px bg-border/50" />
             </div>

             <div className="flex justify-center">
               {googleClientId ? (
                 <GoogleOAuthProvider clientId={googleClientId}>
                   <GoogleLogin
                     onSuccess={(credentialResponse) => {
                       if (credentialResponse.credential) {
                         handleGoogleSuccess(credentialResponse.credential);
                       }
                     }}
                     onError={() => {
                       toast({ title: "Lỗi", description: "Không thể kết nối với Google" });
                     }}
                     useOneTap
                     theme="filled_black"
                     shape="pill"
                   />
                 </GoogleOAuthProvider>
               ) : (
                 <div className="text-xs text-destructive">Thiếu VITE_GOOGLE_CLIENT_ID trong .env</div>
               )}
             </div>

             <p className="text-center text-sm text-muted-foreground mt-6">
               {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
               <button
                 type="button"
                 onClick={() => {
                   setMode(mode === "login" ? "register" : "login");
                   setCaptchaToken(null);
                 }}
                 className="text-primary hover:underline font-medium"
               >
                 {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
               </button>
             </p>
           </div>
         )}
       </div>
      </div>
    </div>
  );
};

export default AuthModal;