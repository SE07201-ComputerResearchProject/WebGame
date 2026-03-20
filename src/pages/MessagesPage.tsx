import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import { MessageCircle, Globe, User, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import authStore from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";
import { io, Socket } from "socket.io-client";

const MessagesPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  const currentUser = authStore.getUser();
  const [activeChat, setActiveChat] = useState<"global" | number | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    api.getFriends().then(res => { if (res?.ok) setFriends(res.friends); });

    const newSocket = io(import.meta.env.VITE_API_BASE || "http://localhost:4000", { transports: ["websocket"] });
    setSocket(newSocket);
    newSocket.emit("register_user", { id: currentUser.id, username: currentUser.username });

    newSocket.on("receive_global_message", (msg) => {
      setActiveChat((currentChat) => {
        if (currentChat === "global") setMessages((prev) => [...prev, msg]);
        return currentChat;
      });
    });

    newSocket.on("receive_private_message", (msg) => {
      setActiveChat((currentChat) => {
        const isRelated = currentChat === msg.sender_id || currentChat === msg.receiver_id;
        if (isRelated) setMessages((prev) => [...prev, msg]);
        return currentChat;
      });
    });

    return () => { newSocket.disconnect(); };
  }, [currentUser]);

  const loadChat = async (type: "global" | number) => {
    setActiveChat(type);
    if (type === "global") {
      const res = await api.getGlobalMessages();
      if (res?.ok) setMessages(res.messages);
    } else if (currentUser) {
      const res = await api.getPrivateMessages(type, currentUser.id);
      if (res?.ok) setMessages(res.messages);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !socket || !activeChat) return;
    
    if (activeChat === "global") {
      socket.emit("send_global_message", { userId: currentUser.id, content: input.trim() });
    } else {
      socket.emit("send_private_message", { senderId: currentUser.id, receiverId: activeChat, content: input.trim() });
    }
    setInput("");
  };

  const getChatName = () => {
    if (activeChat === "global") return "Kênh Thế Giới";
    const friend = friends.find(f => f.id === activeChat);
    return friend ? friend.name : "Đang tải...";
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar onAuthClick={() => setIsAuthOpen(true)} onWalletClick={() => setIsWalletOpen(true)} />
      
      <main className="flex-1 container mx-auto pt-20 pb-6 px-4 flex gap-6 h-full">
        {!currentUser ? (
          <div className="w-full h-full glass-card flex flex-col items-center justify-center rounded-2xl border border-border/50">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Đăng nhập để Chat</h2>
            <Button variant="gaming" onClick={() => setIsAuthOpen(true)}>Đăng nhập ngay</Button>
          </div>
        ) : (
          <>
            {/* CỘT TRÁI: DANH BẠ */}
            <div className="w-80 glass-card rounded-2xl border border-border/50 flex flex-col overflow-hidden hidden md:flex">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <h2 className="font-bold text-lg flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary"/> Đoạn chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <button onClick={() => loadChat("global")} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border ${activeChat === "global" ? "bg-primary/20 border-primary/50" : "hover:bg-muted/50 border-transparent"}`}>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Globe className="w-6 h-6" /></div>
                  <div className="text-left"><p className="font-bold text-foreground">Kênh Thế Giới</p><p className="text-xs text-muted-foreground">Server chung</p></div>
                </button>
                
                <div className="pt-4 pb-2 px-2"><p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Users className="w-4 h-4"/> Bạn bè</p></div>
                
                {friends.map(f => (
                  <button key={f.id} onClick={() => loadChat(f.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border ${activeChat === f.id ? "bg-primary/20 border-primary/50" : "hover:bg-muted/50 border-transparent"}`}>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><User className="w-6 h-6" /></div>
                    <div className="text-left"><p className="font-bold text-foreground">{f.name}</p></div>
                  </button>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI: KHUNG CHAT */}
            <div className="flex-1 glass-card rounded-2xl border border-border/50 flex flex-col overflow-hidden relative">
              {!activeChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-bold">Chọn một đoạn chat để bắt đầu</p>
                </div>
              ) : (
                <>
                  <div className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-6 gap-3 z-10 shadow-sm">
                    {activeChat === "global" ? <Globe className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-neon-green" />}
                    <h2 className="font-bold text-lg">{getChatName()}</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/30">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground mt-20">Hãy là người gửi tin nhắn đầu tiên!</div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        return (
                          <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.username}</span>}
                            <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm md:text-base break-words whitespace-pre-wrap shadow-md ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/80 text-foreground border border-border/50 rounded-tl-sm"}`}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
                    <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                      <input type="text" placeholder="Nhập nội dung tin nhắn..." value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 h-12 pl-5 pr-4 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      <Button type="submit" variant="gaming" size="icon" className="h-12 w-12 rounded-xl shrink-0" disabled={!input.trim()}><Send className="w-5 h-5" /></Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};
export default MessagesPage;