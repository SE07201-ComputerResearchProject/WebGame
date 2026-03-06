import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  X, 
  Search, 
  Send, 
  ArrowLeft,
  Circle,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Friend {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "offline" | "playing";
  game?: string;
  lastMessage?: string;
}

interface Message {
  id: number;
  text: string;
  sender: "me" | "friend";
  time: string;
}

const mockMessages: Message[] = [
  { id: 1, text: "Hey! Đang chơi game gì vậy?", sender: "friend", time: "10:30" },
  { id: 2, text: "Đang farm rank Cyber Racers nè 😎", sender: "me", time: "10:31" },
];

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getFriends();
        if (mounted && res?.ok) setFriends(res.friends || []);
      } catch (e) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, []);

  const filteredFriends = friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const onlineFriends = filteredFriends.filter(f => f.status !== "offline");
  const offlineFriends = filteredFriends.filter(f => f.status === "offline");

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const message: Message = { id: messages.length + 1, text: newMessage, sender: "me", time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((m) => [...m, message]);

    if (selectedFriend) {
      try {
        const socket = socketRef.current;
        if (socket && socket.connected) {
          socket.emit("message", { room: `room-${selectedFriend.id}`, message: newMessage, sender: "me" });
        }
      } catch (e) {
        // ignore
      }
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const statusColor = {
    online: "text-neon-green fill-neon-green",
    playing: "text-neon-cyan fill-neon-cyan",
    offline: "text-muted-foreground fill-muted-foreground",
  } as const;

  useEffect(() => {
    if (!selectedFriend) return;
    const socket = api.createSocket();
    socketRef.current = socket;

    socket.emit("joinRoom", `room-${selectedFriend.id}`);

    const onMessage = (payload: any) => {
      setMessages((m) => [...m, { id: payload.id || Date.now(), text: payload.message, sender: payload.sender === "me" ? "me" : "friend", time: new Date(payload.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) }]);
    };

    socket.on("message", onMessage);

    return () => {
      socket.off("message", onMessage);
    };
  }, [selectedFriend]);
  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-muted hover:bg-muted/80' 
            : 'bg-gradient-gaming hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)] hover:scale-110'
        }`}
      >
        {isOpen ? (
          <Minimize2 className="w-6 h-6 text-foreground" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-orange text-xs font-bold flex items-center justify-center text-background">
              3
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] glass-card rounded-2xl flex flex-col overflow-hidden z-50 shadow-2xl animate-slide-up border border-primary/30">
          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-gaming opacity-20 blur-xl -z-10" />
          
          {selectedFriend ? (
            // Chat View
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card/80">
                <button 
                  onClick={() => setSelectedFriend(null)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img 
                    src={selectedFriend.avatar}
                    alt={selectedFriend.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/50"
                  />
                  <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor[selectedFriend.status]}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{selectedFriend.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFriend.status === "playing" ? `Đang chơi ${selectedFriend.game}` : 
                     selectedFriend.status === "online" ? "Trực tuyến" : "Ngoại tuyến"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
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
                      className={`max-w-[75%] px-3 py-2 rounded-2xl ${
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
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-border/50 bg-card/80">
                <div className="flex items-center gap-2">
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
                    className="rounded-full h-10 w-10"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Friends List View
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/80">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Chat</h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-neon-green/20 text-neon-green">
                    {onlineFriends.length} online
                  </span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm bạn bè..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Friends List */}
              <div className="flex-1 overflow-y-auto scrollbar-gaming">
                {/* Online Friends */}
                {onlineFriends.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Đang hoạt động
                    </p>
                    <div className="space-y-1">
                      {onlineFriends.map(friend => (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                        >
                          <div className="relative">
                            <img 
                              src={friend.avatar}
                              alt={friend.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                            />
                            <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor[friend.status]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{friend.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{friend.lastMessage}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Friends */}
                {offlineFriends.length > 0 && (
                  <div className="p-3 pt-0">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Ngoại tuyến
                    </p>
                    <div className="space-y-1">
                      {offlineFriends.map(friend => (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left opacity-60"
                        >
                          <div className="relative">
                            <img 
                              src={friend.avatar}
                              alt={friend.name}
                              className="w-10 h-10 rounded-full object-cover border border-muted"
                            />
                            <Circle className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusColor[friend.status]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-muted-foreground truncate">{friend.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{friend.lastMessage}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatWidget;
