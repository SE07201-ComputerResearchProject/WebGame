import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProminentSearchBar from "@/components/ProminentSearchBar";
import GameGrid from "@/components/GameGrid";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";
// 1. Import Component MFA Modal vào
import MfaSetupModal from "@/components/MfaSetupModal"; 

const Index = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  // 2. Tạo State để quản lý việc đóng/mở cửa sổ MFA
  const [isMfaOpen, setIsMfaOpen] = useState(false);

  // 3. Lắng nghe tín hiệu 'open-mfa' từ nút bấm trên Navbar
  useEffect(() => {
    const handleOpenMfa = () => setIsMfaOpen(true);
    window.addEventListener('open-mfa', handleOpenMfa);
    
    // Dọn dẹp sự kiện khi chuyển trang để tránh lỗi bộ nhớ
    return () => window.removeEventListener('open-mfa', handleOpenMfa);
  }, []);

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar 
        onAuthClick={() => setIsAuthOpen(true)} 
        onWalletClick={() => setIsWalletOpen(true)}
      />

      {/* Main Content */}
      <main className="pt-16">
        <HeroSection />
        <ProminentSearchBar onSearch={handleSearch} />
        <GameGrid />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Chat Widget */}
      <FloatingChatWidget />

      {/* Các Modals (Cửa sổ nổi) */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
      <WalletModal 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
      />
      
      {/* 4. Nhúng giao diện quét mã QR vào trang */}
      <MfaSetupModal 
        isOpen={isMfaOpen} 
        onClose={() => setIsMfaOpen(false)} 
      />
    </div>
  );
};

export default Index;