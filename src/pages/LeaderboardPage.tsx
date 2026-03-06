import { useState } from "react";
import Navbar from "@/components/Navbar";
import Leaderboard from "@/components/Leaderboard";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import FloatingChatWidget from "@/components/FloatingChatWidget";
import Footer from "@/components/Footer";

const LeaderboardPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onAuthClick={() => setIsAuthOpen(true)}
        onWalletClick={() => setIsWalletOpen(true)}
      />
      <main className="pt-16">
        <Leaderboard />
      </main>
      <Footer />
      <FloatingChatWidget />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};

export default LeaderboardPage;
