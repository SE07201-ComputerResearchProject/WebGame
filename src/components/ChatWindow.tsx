import { useState, useRef, useEffect } from "react";
import { X, Send, Smile, Image, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import authStore from "@/lib/auth";
import { getSocket } from "@/lib/api";

interface ChatWindowProps {
  friend: {
    id: number;
    name: string;
    avatar: string;
    status: string;
  } | null;
  onClose: () => void;
}

const ChatWindow = ({ friend, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = authStore.getUser();
  const socket = getSocket(); // Lấy Socket đang kết nối sẵn

  // 1. Kéo lịch sử chat từ Database khi mở cửa sổ
  useEffect(() => {
    if (!friend || !currentUser) return;
    api.getPrivateMessages(friend.id, currentUser.id).then(res => {
      if (res?.ok) setMessages(res.messages);
    });
  }, [friend, currentUser]);

  // 2. Lắng nghe tin nhắn mới tới qua Socket.io
  useEffect(() => {
    if (!friend || !socket) return;
    
    const handleNewMsg = (msg: any) => {
      // Chỉ nhận tin nhắn nếu người gửi hoặc người nhận là bạn chat hiện tại
      if (msg.sender_id === friend.id || msg.receiver_id === friend.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_private_message", handleNewMsg);
    return () => { socket.off("receive_private_message", handleNewMsg); };
  }, [friend, socket]);

  // Cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!friend) return null;

  // 3. Gửi tin nhắn
  const handleSend = () => {
    if (!newMessage.trim() || !currentUser || !socket) return;
    
    // Bắn tin nhắn lên Server qua Socket
    socket.emit("send_private_message", { 
      senderId: currentUser.id, 
      receiverId: friend.id, 
      content: newMessage.trim() 
    });
    
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-[480px] glass-card rounded-2xl flex flex-col overflow-hidden z-50 shadow-2xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/50">
        <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary/50" />
        <div className="flex-1">
          <p className="font-semibold text-foreground truncate">{friend.name}</p>
          <p className="text-xs text-neon-green">Trực tuyến</p>
        </div>
        <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><MoreVertical className="w-4 h-4" /></button>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Bắt đầu cuộc trò chuyện...
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUser?.id;
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground border border-border/50 rounded-bl-sm"}`}>
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><Smile className="w-5 h-5" /></button>
          <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><Image className="w-5 h-5" /></button>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-10 px-4 rounded-full bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <Button variant="gaming" size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;