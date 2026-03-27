import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import auth from "@/lib/auth";
import api from "@/lib/api";
import { Gamepad2, User, Wallet, Trophy, Users, MessageCircle, Menu, X, Search, Sparkles, ShieldCheck, LogOut, ChevronDown, ShieldAlert, KeyRound, Bell, Coins } from "lucide-react";
import MfaSetupModal from "@/components/MfaSetupModal";
import ChangePasswordModal from "./ChangePasswordModal";

interface NavbarProps { onAuthClick: () => void; onWalletClick: () => void; }

const Navbar = ({ onAuthClick, onWalletClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.getUser());
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // STATE QUẢN LÝ UI
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingFriends, setPendingFriends] = useState(0);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  // STATE LƯU THÔNG BÁO THẬT
  const [notifications, setNotifications] = useState<any[]>([]);

  // ==========================================
  // LOGIC ĐỒNG BỘ DỮ LIỆU & THÔNG BÁO (REAL DATA)
  // ==========================================
  useEffect(() => {
    const handler = () => setUser(auth.getUser());
    window.addEventListener('auth-change', handler);
    
    if (user) {
      // 1. Cập nhật Số dư mới nhất
      api.getMe().then(res => {
        if (res?.ok && res.user) {
          auth.setUser(res.user);
          setUser(res.user);
        }
      }).catch(() => {});

      // 2. Kéo Lịch sử hoạt động làm Thông báo
      api.getActivityLogs().then(res => {
        if (res?.ok && res.logs) {
          // Lấy ID của thông báo mới nhất mà user đã bấm "Đọc" trước đó
          const lastReadId = Number(localStorage.getItem('lastReadNotifId') || 0);

          const formattedLogs = res.logs.map((log: any) => {
            // Tự động dịch Action thành Tiêu đề Tiếng Việt
            let title = "Thông báo hệ thống";
            if (log.action.includes('PAYMENT')) title = "Biến động số dư";
            else if (log.action.includes('LOGIN')) title = "Đăng nhập hệ thống";
            else if (log.action.includes('MFA')) title = "Cài đặt Bảo mật";
            else if (log.action.includes('PASSWORD')) title = "Thay đổi mật khẩu";
            else if (log.action.includes('REGISTER')) title = "Đăng ký tài khoản";

            // Tự động phân loại màu (Thất bại/Tắt -> Đỏ, còn lại -> Xanh)
            const type = log.action.includes('DISABLED') || log.action.includes('FAIL') ? 'fail' : 'success';

            return {
              id: log.id,
              type: type,
              title: title,
              desc: log.description,
              time: new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
              unread: log.id > lastReadId // Nếu ID log này lớn hơn ID đã lưu -> Báo chấm đỏ
            };
          });

          setNotifications(formattedLogs);
        }
      }).catch(err => console.error("Lỗi lấy thông báo:", err));
    }
    return () => window.removeEventListener('auth-change', handler);
  }, [user?.id]); // Thêm user?.id để tự động chạy lại khi đăng nhập

  // Kiểm tra xem có cái nào chưa đọc không
  const hasUnreadNotif = notifications.some(notif => notif.unread);

  // Xử lý khi bấm nút "Đánh dấu đã đọc"
  const handleMarkAllAsRead = () => {
    if (notifications.length > 0) {
      // Tìm ID to nhất (mới nhất) và lưu vào LocalStorage
      const maxId = Math.max(...notifications.map(n => n.id));
      localStorage.setItem('lastReadNotifId', maxId.toString());

      // Tắt sạch trạng thái unread trên giao diện
      setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
    }
  };

  useEffect(() => {
    const handleMsgUpdate = (e: any) => setUnreadMessages(e.detail);
    const handleFriendUpdate = (e: any) => setPendingFriends(e.detail);
    window.addEventListener('update-unread-messages', handleMsgUpdate);
    window.addEventListener('update-friend-requests', handleFriendUpdate);

    if (user) {
      api.getFriendRequests().then(res => {
        if (res?.ok && res.requests) setPendingFriends(res.requests.length);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('update-unread-messages', handleMsgUpdate);
      window.removeEventListener('update-friend-requests', handleFriendUpdate);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) setIsNotifMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4">
        
        <div className="flex items-center justify-between h-16 gap-4">
          
          <div className="flex items-center gap-2 md:gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative"><Gamepad2 className="w-8 h-8 text-primary" /><div className="absolute inset-0 blur-lg bg-primary/50 -z-10" /></div>
              <span className="font-display font-bold text-xl gradient-text hidden sm:block whitespace-nowrap">NEXUS GAMES</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavItem to="/games" icon={<Gamepad2 className="w-4 h-4" />} label="Games" active={location.pathname === '/games'} />
              <NavItem to="/friends" icon={<Users className="w-4 h-4" />} label="Bạn bè" active={location.pathname === '/friends'} badge={pendingFriends} />
              <NavItem to="/messages" icon={<MessageCircle className="w-4 h-4" />} label="Tin nhắn" active={location.pathname === '/messages'} badge={unreadMessages} />
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Tìm kiếm game..." className="w-full h-9 pl-10 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            
            {user ? (
              <>
                <div className="hidden md:flex items-center bg-zinc-900/50 border border-zinc-800 rounded-full p-1 pl-4 shadow-inner mr-1">
                  <div className="flex items-center gap-2 mr-3">
                    <Coins className="w-4 h-4 text-neon-orange" />
                    <span className="font-bold text-zinc-100 text-sm tracking-wide">{user?.balance?.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <Button variant="neon" size="sm" onClick={onWalletClick} className="rounded-full h-7 px-4 text-xs font-bold animate-pulse hover:animate-none">
                    <Wallet className="w-3 h-3 mr-1" /> Nạp
                  </Button>
                </div>

                <div className="relative" ref={notifMenuRef}>
                  <button onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)} className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100 focus:outline-none">
                    <Bell className="w-5 h-5" />
                    {hasUnreadNotif && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background animate-pulse"></span>
                    )}
                  </button>

                  {isNotifMenuOpen && (
                    <div className="absolute right-0 mt-3 w-80 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-2 animate-fade-in z-50">
                      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                        <span className="font-bold text-zinc-100">Thông báo ({notifications.filter(n => n.unread).length})</span>
                        {hasUnreadNotif && (
                          <button onClick={handleMarkAllAsRead} className="text-xs text-neon-cyan hover:underline">Đánh dấu đã đọc</button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                           <div className="p-4 text-center text-sm text-zinc-500">Chưa có thông báo nào</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors ${notif.unread ? 'bg-zinc-900/30' : ''}`}>
                              <div className="flex gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notif.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <div>
                                  <p className={`text-sm font-bold ${notif.unread ? 'text-zinc-100' : 'text-zinc-400'}`}>{notif.title}</p>
                                  <p className="text-xs text-zinc-500 mt-0.5">{notif.desc}</p>
                                  <p className="text-[10px] text-zinc-600 mt-1">{notif.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none ml-1">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center overflow-hidden"><User className="w-4 h-4 text-primary" /></div>
                    <span className="text-sm font-medium hidden sm:block">{user.username}</span><ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 animate-fade-in z-50">
                      <div className="px-4 py-3 border-b border-border/50 mb-2">
                        <p className="text-sm font-bold text-foreground truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email || 'Thành viên Nexus'}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Link 
                          to="/admin"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-neon-orange hover:bg-neon-orange/10 transition-colors border-b border-border/50"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Quản trị hệ thống
                        </Link>
                      )}
                      
                      <button onClick={() => { setIsProfileMenuOpen(false); setIsChangePasswordOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors">
                        <KeyRound className="w-4 h-4 text-primary" />Đổi mật khẩu
                      </button>
                      <button onClick={() => { setIsProfileMenuOpen(false); setIsMfaModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-primary" />Bảo mật MFA
                      </button>
                      
                      <button onClick={() => { setIsProfileMenuOpen(false); auth.logout(); window.location.href = "/"; }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="w-4 h-4" />Đăng xuất</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button variant="gaming" size="sm" onClick={onAuthClick}><User className="w-4 h-4 mr-2" /><span>Đăng nhập</span></Button>
            )}
            
            <button className="md:hidden p-2 text-foreground focus:outline-none shrink-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up bg-background">
            <div className="flex flex-col gap-2">
              <MobileNavItem to="/games" icon={<Gamepad2 className="w-5 h-5" />} label="Games" active={location.pathname === '/games'} onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/friends" icon={<Users className="w-5 h-5" />} label="Bạn bè" active={location.pathname === '/friends'} badge={pendingFriends} onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/messages" icon={<MessageCircle className="w-5 h-5" />} label="Tin nhắn" active={location.pathname === '/messages'} badge={unreadMessages} onClick={() => setIsMenuOpen(false)} />
              
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <div className="px-4 py-2 flex items-center justify-between bg-muted/30 rounded-lg mx-4 mb-2">
                       <span className="text-sm font-medium text-muted-foreground">Số dư hiện tại:</span>
                       <span className="font-bold text-neon-orange">{user?.balance?.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <Button variant="neon" className="w-full justify-start" onClick={() => { setIsMenuOpen(false); onWalletClick(); }}>
                      <Wallet className="w-5 h-5 mr-3" /> Nạp tiền
                    </Button>

                    {user.role === 'admin' && (
                       <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="w-full">
                         <Button variant="outline" className="w-full justify-start border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10">
                           <ShieldAlert className="w-5 h-5 mr-3" /> Quản trị hệ thống
                         </Button>
                       </Link>
                    )}
                    
                    <Button variant="outline" className="w-full justify-start border-border/50" onClick={() => { setIsMenuOpen(false); setIsChangePasswordOpen(true); }}>
                      <KeyRound className="w-5 h-5 mr-3 text-primary" /> Đổi mật khẩu
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-border/50" onClick={() => { setIsMenuOpen(false); setIsMfaModalOpen(true); }}>
                      <ShieldCheck className="w-5 h-5 mr-3 text-primary" /> Bảo mật MFA
                    </Button>
                    
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setIsMenuOpen(false); auth.logout(); window.location.href = "/"; } }>
                      <LogOut className="w-5 h-5 mr-3" /> Đăng xuất
                    </Button>
                  </>
                ) : (
                  <Button variant="gaming" className="w-full justify-start" onClick={() => { setIsMenuOpen(false); onAuthClick(); }}>
                    <User className="w-5 h-5 mr-3" /> Đăng nhập
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    
    <MfaSetupModal isOpen={isMfaModalOpen} onClose={() => setIsMfaModalOpen(false)} />
    <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </>
  );
};

const NavItem = ({ to, icon, label, active, badge }: { to: string; icon: React.ReactNode; label: string; active?: boolean; badge?: number }) => (
  <Link to={to} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
    {icon}
    <span className="font-medium">{label}</span>
    {badge ? <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">{badge > 99 ? '99+' : badge}</span> : null}
  </Link>
);

const MobileNavItem = ({ to, icon, label, active, badge, onClick }: { to: string; icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) => (
  <Link to={to} onClick={onClick} className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
    {icon}
    <span className="font-medium">{label}</span>
    {badge ? <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{badge}</span> : null}
  </Link>
);

export default Navbar;