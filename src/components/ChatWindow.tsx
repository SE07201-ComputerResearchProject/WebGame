import { useState, useRef, useEffect } from "react";
import { X, Send, Smile, Image, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  text: string;
  sender: "me" | "friend";
  time: string;
}

interface ChatWindowProps {
  friend: {
    id: number;
    name: string;
    avatar: string;
    status: string;
  } | null;
  onClose: () => void;
}

const mockMessages: Message[] = [
  { id: 1, text: "Hey! Đang chơi game gì vậy?", sender: "friend", time: "10:30" },
  { id: 2, text: "Đang farm rank Cyber Racers nè 😎", sender: "me", time: "10:31" },
  { id: 3, text: "Ngon! Để tí vào party cùng nhé", sender: "friend", time: "10:32" },
  { id: 4, text: "OK bro, đợi tí nha", sender: "me", time: "10:32" },
];

const ChatWindow = ({ friend, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!friend) return null;

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, message]);
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
        <img 
          src={friend.avatar}
          alt={friend.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-primary/50"
        />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{friend.name}</p>
          <p className="text-xs text-neon-green">Trực tuyến</p>
        </div>
        <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground">
          <MoreVertical className="w-4 h-4" />
        </button>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-gaming p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                message.sender === "me"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-[10px] mt-1 ${
                message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <Image className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 h-10 px-4 rounded-full bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <Button 
            variant="gaming" 
            size="icon" 
            className="rounded-full"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
