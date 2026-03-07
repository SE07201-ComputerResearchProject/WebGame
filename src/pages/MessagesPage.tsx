import { useState } from "react";
import Navbar from "@/components/Navbar";
import ChatWindow from "@/components/ChatWindow";
import FriendsSidebar from "@/components/FriendsSidebar";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";

const MessagesPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [chatFriend, setChatFriend] = useState<any>(null);
  const [showFriends, setShowFriends] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onAuthClick={() => setIsAuthOpen(true)}
        onWalletClick={() => setIsWalletOpen(true)}
      />
      <main className="pt-16 min-h-[80vh] flex items-center justify-center">
        {chatFriend ? (
          <ChatWindow friend={chatFriend} onClose={() => setChatFriend(null)} />
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-display mb-2">Chọn một người bạn để bắt đầu trò chuyện</p>
            <p className="text-sm">Mở danh sách bạn bè từ sidebar bên phải</p>
          </div>
        )}
        <FriendsSidebar
          isOpen={showFriends}
          onClose={() => setShowFriends(false)}
          onOpenChat={(friend) => setChatFriend(friend)}
        />
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};

export default MessagesPage;