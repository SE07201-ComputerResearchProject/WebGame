import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProminentSearchBar from "@/components/ProminentSearchBar";
import GameGrid from "@/components/GameGrid";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";

const Index = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleSearch = (query: string) => {
    // ⚠️ SECURITY DEMO: This is intentionally vulnerable for educational purposes
    // In production, always sanitize inputs before processing
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

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
      <WalletModal 
        isOpen={isWalletOpen} 
        onClose={() => setIsWalletOpen(false)} 
      />
    </div>
  );
};

export default Index;
