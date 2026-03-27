import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, UserCheck, Search, ShieldCheck, User, Sparkles, UserMinus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import authStore from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom"; // Thêm để điều hướng sang trang tin nhắn

const FriendsPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const currentUser = authStore.getUser();
  const navigate = useNavigate(); // Khởi tạo hook điều hướng

  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const [friendsRes, requestsRes, usersRes] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
        api.getUsers()
      ]);
      if (friendsRes?.ok) setFriends(friendsRes.friends);
      if (requestsRes?.ok) {
        setRequests(requestsRes.requests);
        window.dispatchEvent(new CustomEvent('update-friend-requests', { detail: requestsRes.requests.length }));
      }
      if (usersRes?.ok && usersRes.users) {
        const myFriendsIds = friendsRes?.friends?.map((f: any) => f.id) || [];
        const filteredUsers = usersRes.users.filter((u: any) => 
          String(u.id) !== String(currentUser.id) && !myFriendsIds.includes(u.id)
        );
        setAllUsers(filteredUsers);
      }
    } catch (e) { toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" }); }
  };

  useEffect(() => { fetchData(); }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccept = async (requestId: number) => {
    const res = await api.acceptFriendRequest({ requestId });
    if (res?.ok) { toast({ title: "Thành công", description: res.message }); fetchData(); }
  };

  const handleAddFriend = async (friendId: number) => {
    const res = await api.sendFriendRequest({ friendId });
    if (res?.ok) { 
      toast({ title: "Thành công", description: "Đã gửi lời mời!" }); 
      setSearchQuery(""); 
      setIsSearchFocused(false);
      fetchData(); 
    } else {
      toast({ title: "Lỗi", description: res?.error, variant: "destructive" });
    }
  };

  // ==========================================
  // HÀM MỚI: XỬ LÝ HỦY KẾT BẠN
  // ==========================================
  const handleRemoveFriend = async (friendId: number, friendName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`)) return;

    try {
      const res = await api.removeFriend(friendId);
      if (res?.ok) {
        toast({ title: "Thành công", description: `Đã hủy kết bạn với ${friendName}` });
        // Xóa ngay lập tức khỏi giao diện để tránh phải reload lại toàn bộ
        setFriends(prev => prev.filter(f => f.id !== friendId));
      } else {
        toast({ title: "Lỗi", description: res?.error || "Không thể hủy kết bạn", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Lỗi", description: "Mất kết nối máy chủ", variant: "destructive" });
    }
  };

  const safeQuery = searchQuery.toLowerCase().trim();
  const filteredUsers = allUsers.filter(u => {
    const nameMatch = (u.username || "").toLowerCase().includes(safeQuery);
    const idMatch = u.id.toString() === safeQuery;
    return nameMatch || idMatch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onAuthClick={() => setIsAuthOpen(true)} onWalletClick={() => setIsWalletOpen(true)} />
      
      <main className="flex-1 container max-w-4xl mx-auto pt-24 pb-12 px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gaming flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Cộng Đồng</h1>
            <p className="text-muted-foreground mb-1">Kết nối và thi đấu cùng hàng triệu game thủ khác</p>
            {currentUser && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-sm font-medium text-primary">ID của bạn: <strong className="font-mono">#{currentUser.id}</strong></span>
              </div>
            )}
          </div>
        </div>

        {!currentUser ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-border/50">
            <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để xem danh bạ và kết bạn.</p>
            <Button variant="gaming" onClick={() => setIsAuthOpen(true)}>Đăng nhập ngay</Button>
          </div>
        ) : (
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 rounded-xl p-1 mb-8">
              <TabsTrigger value="friends" className="rounded-lg text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Users className="w-4 h-4 mr-2"/> Bạn bè ({friends.length})</TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"><UserCheck className="w-4 h-4 mr-2"/> Lời mời {requests.length > 0 && <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">{requests.length}</span>}</TabsTrigger>
              <TabsTrigger value="add" className="rounded-lg text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UserPlus className="w-4 h-4 mr-2"/> Thêm bạn</TabsTrigger>
            </TabsList>

            {/* TAB BẠN BÈ ĐƯỢC CẬP NHẬT GIAO DIỆN HOVER VÀ NÚT TƯƠNG TÁC */}
            <TabsContent value="friends" className="glass-card rounded-2xl p-6 border border-border/50 min-h-[400px]">
              {friends.length === 0 ? <p className="text-center text-muted-foreground mt-20">Bạn chưa có người bạn nào. Hãy tìm thêm bạn mới nhé!</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map(f => (
                    <div key={f.id} className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all overflow-hidden">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate">{f.name || f.username} <span className="text-sm font-normal text-muted-foreground">#{f.id}</span></h3>
                          <p className="text-xs text-neon-green">Đã kết bạn</p>
                        </div>
                      </div>
                      
                      {/* KHỐI NÚT ACTION (Sẽ hiện ra khi di chuột vào thẻ) */}
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => navigate(`/messages?user=${f.id}`)} 
                          className="h-9 w-9 border-primary/20 hover:bg-primary/20 hover:text-primary transition-colors" 
                          title="Nhắn tin"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleRemoveFriend(f.id, f.name || f.username)} 
                          className="h-9 w-9 border-destructive/20 hover:bg-destructive/20 hover:text-destructive transition-colors" 
                          title="Hủy kết bạn"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="glass-card rounded-2xl p-6 border border-border/50 min-h-[400px]">
              {requests.length === 0 ? <p className="text-center text-muted-foreground mt-20">Chưa có lời mời kết bạn nào.</p> : (
                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.request_id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="w-12 h-12 rounded-full bg-neon-orange/20 flex items-center justify-center shrink-0"><User className="w-6 h-6 text-neon-orange" /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{req.name} <span className="text-sm font-normal text-muted-foreground">#{req.user_id}</span></h3>
                        <p className="text-xs text-muted-foreground">Vừa gửi lời mời cho bạn</p>
                      </div>
                      <Button variant="gaming" size="sm" onClick={() => handleAccept(req.request_id)}>Chấp nhận</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="glass-card rounded-2xl p-6 border border-border/50 min-h-[400px] flex flex-col">
              <div className="relative mb-8" ref={searchRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 z-20" />
                <input 
                  type="text" 
                  placeholder="Nhập tên hoặc ID game thủ (vd: 5)..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50 relative z-10 transition-all shadow-sm" 
                />
                
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 animate-fade-in custom-scrollbar">
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Kết quả tìm kiếm</p>
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">Không tìm thấy game thủ nào phù hợp</div>
                      ) : (
                        filteredUsers.map(u => (
                          <div key={u.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                              <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground truncate">{u.username} <span className="text-xs font-normal text-muted-foreground">#{u.id}</span></h3>
                            </div>
                            <Button variant="gaming" size="sm" onClick={() => handleAddFriend(u.id)}>Kết bạn</Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-neon-orange" /> Gợi ý kết bạn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allUsers.slice(0, 6).map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all group">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <User className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">{u.username} <span className="text-sm font-normal text-muted-foreground">#{u.id}</span></h3>
                        <p className="text-xs text-muted-foreground">Người chơi Nexus</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleAddFriend(u.id)} className="hover:bg-primary/20 hover:text-primary border-primary/50">Thêm</Button>
                    </div>
                  ))}
                  {allUsers.length === 0 && (
                    <div className="col-span-2 text-center text-muted-foreground py-10">Chưa có gợi ý nào dành cho bạn lúc này.</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
    </div>
  );
};
export default FriendsPage;