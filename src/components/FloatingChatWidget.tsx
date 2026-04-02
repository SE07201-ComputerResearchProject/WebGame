import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, ChevronDown, ArrowLeft, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import auth from "@/lib/auth";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

interface ChatMessage {
  id: number;
  content: string;
  username: string;
  sender_id: number;
  receiver_id?: number | null;
  created_at: string;
}

// 1. CẬP NHẬT INTERFACE: Cho phép nhận cả name và username
interface ChatUser {
  id: number;
  username?: string;
  name?: string;
}

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "global" | "private">("list");
  const [targetUser, setTargetUser] = useState<ChatUser | null>(null);
  
  const [usersList, setUsersList] = useState<ChatUser[]>([]);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.getUser();

  const [unreadGlobal, setUnreadGlobal] = useState(0); 
  const [unreadPrivate, setUnreadPrivate] = useState<Record<number, number>>({}); 

  const totalUnread = unreadGlobal + Object.values(unreadPrivate).reduce((a, b) => a + b, 0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('update-unread-messages', { detail: totalUnread }));
  }, [totalUnread]);

  useEffect(() => {
    if (!currentUser) return;

    // 2. ĐỔI API THÀNH getFriends ĐỂ CHỈ HIỂN THỊ BẠN BÈ
    const fetchUsers = async () => {
      const res = await api.getFriends();
      if (res?.ok) {
        setUsersList(res.friends.filter((u: ChatUser) => u.id !== currentUser.id));
      }
    };
    fetchUsers();

    const newSocket = io(import.meta.env.VITE_API_BASE || "http://localhost:4000", { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.emit("register_user", { id: currentUser.id, username: currentUser.username });

    newSocket.on("receive_global_message", (newMessage: ChatMessage) => {
      setGlobalMessages((prev) => [...prev, newMessage]);
      
      setIsOpen((currentIsOpen) => {
        setView((currentView) => {
          if (!currentIsOpen || currentView !== "global") {
            setUnreadGlobal((prev) => prev + 1);
          }
          return currentView;
        });
        return currentIsOpen;
      });
    });

    newSocket.on("receive_private_message", (newMessage: ChatMessage) => {
      setPrivateMessages((prev) => [...prev, newMessage]);
      
      const isMe = newMessage.sender_id === currentUser.id;
      if (isMe) return;

      setIsOpen((currentIsOpen) => {
        setView((currentView) => {
          setTargetUser((currentTargetUser) => {
            const isChattingWithThem = currentIsOpen && currentView === "private" && currentTargetUser?.id === newMessage.sender_id;
            
            if (!isChattingWithThem) {
              toast({ 
                title: `Tin nhắn từ ${newMessage.username}`, 
                description: <div className="line-clamp-2 break-words text-sm opacity-90">{newMessage.content}</div> 
              });

              setUnreadPrivate((prev) => ({
                ...prev,
                [newMessage.sender_id]: (prev[newMessage.sender_id] || 0) + 1
              }));
            }
            return currentTargetUser;
          });
          return currentView;
        });
        return currentIsOpen;
      });
    });
    return () => { newSocket.disconnect(); };
  }, [currentUser?.id]);

  const openChat = async (type: "global" | "private", user: ChatUser | null = null) => {
    setView(type);
    setTargetUser(user);
    
    if (type === "global") {
      setUnreadGlobal(0); 
      const res = await api.getGlobalMessages();
      if (res?.ok) setGlobalMessages(res.messages);
    } else if (type === "private" && user && currentUser) {
      setUnreadPrivate((prev) => ({ ...prev, [user.id]: 0 })); 
      const res = await api.getPrivateMessages(user.id, currentUser.id);
      if (res?.ok) setPrivateMessages(res.messages);
    }
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [globalMessages, privateMessages, isOpen, view]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !socket) return;
    
    if (view === "global") {
      socket.emit("send_global_message", { userId: currentUser.id, content: input.trim() });
    } else if (view === "private" && targetUser) {
      socket.emit("send_private_message", { 
        senderId: currentUser.id, 
        receiverId: targetUser.id, 
        content: input.trim() 
      });
    }
    setInput("");
  };

  const currentMessages = view === "global" ? globalMessages : privateMessages;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] glass-card rounded-2xl border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.15)] flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
          
          <div className="h-14 bg-background/80 border-b border-border/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {view !== "list" && (
                <button onClick={() => setView("list")} className="p-1 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="font-bold text-foreground flex items-center gap-2">
                {view === "list" && "Danh Bạ Trực Tuyến"}
                {view === "global" && <><Globe className="w-4 h-4 text-primary" /> Kênh Thế Giới</>}
                {/* 3. HIỂN THỊ TÊN ƯU TIÊN NAME */}
                {view === "private" && <><User className="w-4 h-4 text-neon-green" /> {targetUser?.name || targetUser?.username}</>}
              </h3>
            </div>
            
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {view === "list" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background/30 backdrop-blur-sm">
              <button 
                onClick={() => openChat("global")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-primary/20 bg-primary/5 mb-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold">Kênh Thế Giới</p>
                  <p className="text-xs text-muted-foreground">Chat chung với toàn server</p>
                </div>
                {unreadGlobal > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {unreadGlobal}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 mb-3 px-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                {/* 4. ĐỔI TIÊU ĐỀ THÀNH BẠN BÈ CHO ĐỒNG BỘ */}
                <span className="text-xs font-bold text-muted-foreground uppercase">Bạn bè</span>
              </div>

              <div className="space-y-2">
                {usersList.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-4">Chưa có người bạn nào.</p>
                ) : (
                  usersList.map((user) => (
                    <button 
                      key={user.id} onClick={() => openChat("private", user)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-1">
                        {/* 5. HIỂN THỊ TÊN BẠN BÈ */}
                        <p className="font-medium">{user.name || user.username}</p>
                      </div>
                      {unreadPrivate[user.id] > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {unreadPrivate[user.id]}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {view !== "list" && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/30 backdrop-blur-sm">
                {currentMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p className="text-sm">Bắt đầu trò chuyện ngay!</p>
                  </div>
                ) : (
                  currentMessages.map((msg, index) => {
                    const isMe = currentUser?.id === msg.sender_id;
                    return (
                      <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (
                          <span className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                            {msg.username}
                          </span>
                        )}
                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/80 text-foreground border border-border/50 rounded-tl-sm"}`}>
                          {msg.content}
                        </div>  
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-background/80 border-t border-border/50">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                  <input
                    type="text" placeholder="Nhập tin nhắn..." value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-10 pl-4 pr-10 rounded-xl bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <Button type="submit" variant="gaming" size="icon" className="h-10 w-10 shrink-0 rounded-xl" disabled={!input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "bg-muted text-foreground" : "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]"}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        
        {totalUnread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-bounce">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

    </div>
  );
};

export default FloatingChatWidget;