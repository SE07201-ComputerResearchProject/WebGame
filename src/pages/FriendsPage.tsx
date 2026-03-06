import { useState } from "react";
import Navbar from "@/components/Navbar";
import FriendsSidebar from "@/components/FriendsSidebar";
import ChatWindow from "@/components/ChatWindow";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";

const FriendsPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onAuthClick={() => setIsAuthOpen(true)}
        onWalletClick={() => setIsWalletOpen(true)}
      />
      <main className="pt-16">
        {/* Friends sidebar always open on this page */}
        <FriendsSidebar
          isOpen={true}
          onClose={() => {}}
          onOpenChat={(friend) => setChatFriend(friend)}
        />
        {chatFriend && (
          <ChatWindow friend={chatFriend} onClose={() => setChatFriend(null)} />
        )}
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};

export default FriendsPage;
