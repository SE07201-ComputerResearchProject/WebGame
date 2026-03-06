import { Gamepad2, Facebook, Twitter, Youtube, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative pt-20 pb-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-card to-background" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-magenta/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Gamepad2 className="w-8 h-8 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/50 -z-10" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">
                NEXUS GAMES
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Nền tảng chơi game trực tuyến hàng đầu Việt Nam với hàng trăm tựa game hấp dẫn.
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon icon={<Facebook className="w-5 h-5" />} />
              <SocialIcon icon={<Twitter className="w-5 h-5" />} />
              <SocialIcon icon={<Youtube className="w-5 h-5" />} />
              <SocialIcon icon={<Instagram className="w-5 h-5" />} />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Sản phẩm</h4>
            <ul className="space-y-3">
              <FooterLink>Game miễn phí</FooterLink>
              <FooterLink>Game Premium</FooterLink>
              <FooterLink>Gói nạp</FooterLink>
              <FooterLink>Thẻ quà tặng</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Hỗ trợ</h4>
            <ul className="space-y-3">
              <FooterLink>Trung tâm trợ giúp</FooterLink>
              <FooterLink>Liên hệ</FooterLink>
              <FooterLink>FAQ</FooterLink>
              <FooterLink>Báo lỗi</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Pháp lý</h4>
            <ul className="space-y-3">
              <FooterLink>Điều khoản sử dụng</FooterLink>
              <FooterLink>Chính sách bảo mật</FooterLink>
              <FooterLink>Chính sách cookie</FooterLink>
              <FooterLink>Giấy phép</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Nexus Games. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Made with ❤️ in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a
    href="#"
    className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
  >
    {icon}
  </a>
);

const FooterLink = ({ children }: { children: React.ReactNode }) => (
  <li>
    <a
      href="#"
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      {children}
    </a>
  </li>
);

export default Footer;
