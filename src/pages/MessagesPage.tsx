import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <main className="pt-16 min-h-[80vh] flex items-center justify-center relative">
        {chatFriend ? (
          <ChatWindow friend={chatFriend} onClose={() => setChatFriend(null)} />
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-display mb-2">Chọn một người bạn để bắt đầu trò chuyện</p>
            <p className="text-sm">Mở danh sách bạn bè từ nút phía trên bên phải</p>
          </div>
        )}
        
        {/* Toggle Friends Button */}
        {!showFriends && (
          <Button
            onClick={() => setShowFriends(true)}
            className="fixed bottom-8 right-8 rounded-full shadow-lg z-40 gap-2"
            size="lg"
          >
            <Users className="w-5 h-5" />
            Bạn bè ({0})
          </Button>
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