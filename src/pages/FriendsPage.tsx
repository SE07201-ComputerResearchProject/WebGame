import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import WalletModal from "@/components/WalletModal";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, UserCheck, Search, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import authStore from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

const FriendsPage = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const currentUser = authStore.getUser();

  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
      if (usersRes?.ok) {
        // Lọc bỏ chính mình và những người đã là bạn bè khỏi danh sách gợi ý
        const myFriendsIds = friendsRes?.friends?.map((f: any) => f.id) || [];
        const filteredUsers = usersRes.users.filter((u: any) => u.id !== currentUser.id && !myFriendsIds.includes(u.id));
        setAllUsers(filteredUsers);
      }
    } catch (e) { toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" }); }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleAccept = async (requestId: number) => {
    const res = await api.acceptFriendRequest({ requestId });
    if (res?.ok) { toast({ title: "Thành công", description: res.message }); fetchData(); }
  };

  const handleAddFriend = async (friendId: number) => {
    const res = await api.sendFriendRequest({ friendId });
    if (res?.ok) { toast({ title: "Thành công", description: "Đã gửi lời mời!" }); fetchData(); }
    else toast({ title: "Lỗi", description: res?.error, variant: "destructive" });
  };

  const filteredUsers = allUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onAuthClick={() => setIsAuthOpen(true)} onWalletClick={() => setIsWalletOpen(true)} />
      
      <main className="flex-1 container max-w-4xl mx-auto pt-24 pb-12 px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gaming flex items-center justify-center shadow-lg shadow-primary/20">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Cộng Đồng</h1>
            <p className="text-muted-foreground">Kết nối và thi đấu cùng hàng triệu game thủ khác</p>
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

            <TabsContent value="friends" className="glass-card rounded-2xl p-6 border border-border/50 min-h-[400px]">
              {friends.length === 0 ? <p className="text-center text-muted-foreground mt-20">Bạn chưa có người bạn nào. Hãy tìm thêm bạn mới nhé!</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friends.map(f => (
                    <div key={f.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
                      <div className="flex-1"><h3 className="font-bold text-lg">{f.name}</h3><p className="text-xs text-neon-green">Đã kết bạn</p></div>
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
                      <div className="w-12 h-12 rounded-full bg-neon-orange/20 flex items-center justify-center"><User className="w-6 h-6 text-neon-orange" /></div>
                      <div className="flex-1"><h3 className="font-bold text-lg">{req.name}</h3><p className="text-xs text-muted-foreground">Vừa gửi lời mời cho bạn</p></div>
                      <Button variant="gaming" size="sm" onClick={() => handleAccept(req.request_id)}>Chấp nhận</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="glass-card rounded-2xl p-6 border border-border/50 min-h-[400px]">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input type="text" placeholder="Tìm kiếm tên game thủ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-14 pl-12 pr-4 rounded-xl bg-muted/50 border border-border/50 focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                    <div className="flex-1"><h3 className="font-bold text-lg">{u.username}</h3></div>
                    <Button variant="outline" size="sm" onClick={() => handleAddFriend(u.id)} className="hover:bg-primary/20 hover:text-primary border-primary/50">Kết bạn</Button>
                  </div>
                ))}
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