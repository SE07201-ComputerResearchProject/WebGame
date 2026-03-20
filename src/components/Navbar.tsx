import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import auth from "@/lib/auth";
import api from "@/lib/api";
import { Gamepad2, User, Wallet, Trophy, Users, MessageCircle, Menu, X, Search, Sparkles, ShieldCheck, LogOut, ChevronDown, ShieldAlert } from "lucide-react";
import MfaSetupModal from "@/components/MfaSetupModal";

interface NavbarProps { onAuthClick: () => void; onWalletClick: () => void; }

const Navbar = ({ onAuthClick, onWalletClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.getUser());
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // STATE QUẢN LÝ CHẤM ĐỎ VÀ MODAL MFA
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingFriends, setPendingFriends] = useState(0);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setUser(auth.getUser());
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, []);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        
        {/* BỐ CỤC CHUẨN: CHIA LÀM 3 CỤM RÕ RÀNG TRÁI - GIỮA - PHẢI */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* CỤM 1 (BÊN TRÁI): LOGO VÀ MENU CHÍNH */}
          <div className="flex items-center gap-2 md:gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative"><Gamepad2 className="w-8 h-8 text-primary" /><div className="absolute inset-0 blur-lg bg-primary/50 -z-10" /></div>
              <span className="font-display font-bold text-xl gradient-text hidden sm:block whitespace-nowrap">NEXUS GAMES</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <NavItem to="/games" icon={<Gamepad2 className="w-4 h-4" />} label="Games" active={location.pathname === '/games'} />
              <NavItem to="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Xếp hạng" active={location.pathname === '/leaderboard'} />
              <NavItem to="/friends" icon={<Users className="w-4 h-4" />} label="Bạn bè" active={location.pathname === '/friends'} badge={pendingFriends} />
              <NavItem to="/messages" icon={<MessageCircle className="w-4 h-4" />} label="Tin nhắn" active={location.pathname === '/messages'} badge={unreadMessages} />
            </div>
          </div>

          {/* CỤM 2 (CHÍNH GIỮA): THANH TÌM KIẾM */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Tìm kiếm game..." className="w-full h-9 pl-10 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>

          {/* CỤM 3 (BÊN PHẢI): NÚT ACTION VÀ AVATAR */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="hidden md:block">
              <Button variant="neon" size="sm" onClick={onWalletClick} className="relative overflow-hidden group/wallet animate-pulse hover:animate-none">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 group-hover/wallet:opacity-100 opacity-0 transition-opacity" /><Wallet className="w-4 h-4" /><span className="font-bold">Nạp tiền</span><Sparkles className="w-3 h-3 text-neon-orange ml-1" />
              </Button>
            </div>

            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors focus:outline-none">
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
                    {/* Nút gọi Modal trực tiếp bằng State (Không dùng CustomEvent nữa) */}
                    <button onClick={() => { setIsProfileMenuOpen(false); setIsMfaModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"><ShieldCheck className="w-4 h-4 text-primary" />Bảo mật MFA</button>
                    <button onClick={() => { setIsProfileMenuOpen(false); auth.logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="w-4 h-4" />Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (<Button variant="gaming" size="sm" onClick={onAuthClick}><User className="w-4 h-4" /><span>Đăng nhập</span></Button>)}
            
            <button className="md:hidden p-2 text-foreground focus:outline-none shrink-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up bg-background">
            <div className="flex flex-col gap-2">
              <MobileNavItem to="/games" icon={<Gamepad2 className="w-5 h-5" />} label="Games" active={location.pathname === '/games'} onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="Xếp hạng" active={location.pathname === '/leaderboard'} onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/friends" icon={<Users className="w-5 h-5" />} label="Bạn bè" active={location.pathname === '/friends'} badge={pendingFriends} onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/messages" icon={<MessageCircle className="w-5 h-5" />} label="Tin nhắn" active={location.pathname === '/messages'} badge={unreadMessages} onClick={() => setIsMenuOpen(false)} />
              
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="neon" className="w-full justify-start" onClick={() => { setIsMenuOpen(false); onWalletClick(); }}>
                  <Wallet className="w-5 h-5 mr-3" /> Nạp tiền
                </Button>
                
                {user ? (
                  <>
                    {user.role === 'admin' && (
                       <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="w-full">
                         <Button variant="outline" className="w-full justify-start border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10">
                           <ShieldAlert className="w-5 h-5 mr-3" /> Quản trị hệ thống
                         </Button>
                       </Link>
                    )}
                    <Button variant="outline" className="w-full justify-start border-border/50" onClick={() => { setIsMenuOpen(false); setIsMfaModalOpen(true); }}>
                      <ShieldCheck className="w-5 h-5 mr-3 text-primary" /> Bảo mật MFA
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setIsMenuOpen(false); auth.logout(); }}>
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
      
      {/* Modal nay sẽ đi theo Navbar đến mọi ngóc ngách của hệ thống */}
      <MfaSetupModal isOpen={isMfaModalOpen} onClose={() => setIsMfaModalOpen(false)} />
    </nav>
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