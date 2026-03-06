import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import auth from "@/lib/auth";
import { 
  Gamepad2, 
  User, 
  Wallet, 
  Trophy, 
  Users, 
  MessageCircle,
  Menu,
  X,
  Search,
  Sparkles
} from "lucide-react";

interface NavbarProps {
  onAuthClick: () => void;
  onWalletClick: () => void;
}

const Navbar = ({ onAuthClick, onWalletClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.getUser());
  const location = useLocation();

  useEffect(() => {
    const handler = () => setUser(auth.getUser());
    window.addEventListener('auth-change', handler);
    return () => window.removeEventListener('auth-change', handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/50 -z-10" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">
              NEXUS GAMES
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavItem to="/games" icon={<Gamepad2 className="w-4 h-4" />} label="Games" active={location.pathname === '/games'} />
            <NavItem to="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Xếp hạng" active={location.pathname === '/leaderboard'} />
            <NavItem to="/friends" icon={<Users className="w-4 h-4" />} label="Bạn bè" active={location.pathname === '/friends'} />
            <NavItem to="/messages" icon={<MessageCircle className="w-4 h-4" />} label="Tin nhắn" active={location.pathname === '/messages'} />
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm game..."
                className="w-64 h-9 pl-10 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="neon" 
              size="sm" 
              onClick={onWalletClick}
              className="relative overflow-hidden group/wallet animate-pulse hover:animate-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 group-hover/wallet:opacity-100 opacity-0 transition-opacity" />
              <Wallet className="w-4 h-4" />
              <span className="font-bold">Nạp tiền</span>
              <Sparkles className="w-3 h-3 text-neon-orange ml-1" />
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.username}</span>
                <Button variant="ghost" size="sm" onClick={() => { auth.logout(); }}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <Button variant="gaming" size="sm" onClick={onAuthClick}>
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-2">
              <MobileNavItem to="/games" icon={<Gamepad2 className="w-5 h-5" />} label="Games" active={location.pathname === '/games'} />
              <MobileNavItem to="/leaderboard" icon={<Trophy className="w-5 h-5" />} label="Xếp hạng" active={location.pathname === '/leaderboard'} />
              <MobileNavItem to="/friends" icon={<Users className="w-5 h-5" />} label="Bạn bè" active={location.pathname === '/friends'} />
              <MobileNavItem to="/messages" icon={<MessageCircle className="w-5 h-5" />} label="Tin nhắn" active={location.pathname === '/messages'} />
              <div className="flex gap-2 mt-4">
                <Button variant="neon" size="sm" className="flex-1" onClick={onWalletClick}>
                  <Wallet className="w-4 h-4" />
                  Nạp tiền
                </Button>
                <Button variant="gaming" size="sm" className="flex-1" onClick={onAuthClick}>
                  <User className="w-4 h-4" />
                  Đăng nhập
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active 
        ? "text-primary bg-primary/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const MobileNavItem = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? "text-primary bg-primary/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

export default Navbar;
