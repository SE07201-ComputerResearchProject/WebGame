import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import auth from "@/lib/auth";

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [submitName, setSubmitName] = useState(auth.getUser()?.username || "");
  const [submitScore, setSubmitScore] = useState(0);

  const load = async () => {
    try {
      const res = await api.getLeaderboard();
      if (res?.ok) {
        // Tái cấu trúc dữ liệu thật: Tự động cấp avatar nếu Database không có
        const realData = res.leaderboard.map((p: any) => ({
          ...p,
          avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`,
          change: 'same' // Mặc định không đổi vì chưa có lịch sử so sánh
        }));
        setLeaderboardData(realData);
      }
    } catch (e) {
      console.error("Lỗi tải bảng xếp hạng", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitName || !submitScore) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên và số điểm" });
      return;
    }
    try {
      const res = await api.submitScore({ name: submitName, score: Number(submitScore) });
      if (res?.ok) {
        load(); // Tải lại dữ liệu sau khi gửi thành công
        toast({ title: "Gửi điểm thành công" });
      } else {
        toast({ title: "Lỗi", description: res?.error || "Không thể gửi điểm" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-card" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-neon-orange" />
            <h2 className="font-display text-4xl font-bold text-foreground">
              Bảng Xếp Hạng
            </h2>
          </div>
          <p className="text-muted-foreground">Top game thủ xuất sắc nhất</p>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <form onSubmit={handleSubmitScore} className="flex gap-2">
            <input value={submitName} onChange={(e) => setSubmitName(e.target.value)} placeholder="Tên" className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
            <input value={submitScore} onChange={(e) => setSubmitScore(Number(e.target.value))} type="number" placeholder="Điểm" className="w-28 h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground" type="submit">Gửi</button>
          </form>
        </div>

        {leaderboardData.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-12">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img src={leaderboardData[1].avatar} alt={leaderboardData[1].name} className="w-20 h-20 rounded-full border-4 border-gray-400 object-cover" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="glass-card px-6 py-4 text-center rounded-t-xl">
              <p className="font-display font-semibold text-foreground">{leaderboardData[1].name}</p>
              <p className="text-sm text-muted-foreground">{leaderboardData[1].score.toLocaleString()} pts</p>
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-gray-600 to-gray-400 rounded-b-xl flex items-center justify-center">
              <span className="font-display text-3xl font-bold text-white">2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-8">
            <div className="relative mb-4">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <Crown className="w-10 h-10 text-neon-orange animate-glow-pulse" />
              </div>
              <img src={leaderboardData[0].avatar} alt={leaderboardData[0].name} className="w-24 h-24 rounded-full border-4 border-neon-orange object-cover shadow-[0_0_30px_hsl(var(--neon-orange)/0.5)]" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-neon-orange flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="glass-card px-8 py-4 text-center rounded-t-xl neon-border">
              <p className="font-display font-bold text-lg text-primary">{leaderboardData[0].name}</p>
              <p className="text-sm text-muted-foreground">{leaderboardData[0].score.toLocaleString()} pts</p>
            </div>
            <div className="w-full h-32 bg-gradient-to-t from-neon-orange to-yellow-400 rounded-b-xl flex items-center justify-center">
              <span className="font-display text-4xl font-bold text-white">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <img src={leaderboardData[2].avatar} alt={leaderboardData[2].name} className="w-20 h-20 rounded-full border-4 border-amber-700 object-cover" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="glass-card px-6 py-4 text-center rounded-t-xl">
              <p className="font-display font-semibold text-foreground">{leaderboardData[2].name}</p>
              <p className="text-sm text-muted-foreground">{leaderboardData[2].score.toLocaleString()} pts</p>
            </div>
            <div className="w-full h-20 bg-gradient-to-t from-amber-800 to-amber-600 rounded-b-xl flex items-center justify-center">
              <span className="font-display text-3xl font-bold text-white">3</span>
            </div>
          </div>
        </div>
        )}

        <div className="max-w-2xl mx-auto glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Hạng</div>
              <div className="col-span-6">Người chơi</div>
              <div className="col-span-3 text-right">Điểm</div>
              <div className="col-span-1 text-center">+/-</div>
            </div>
          </div>
          <div className="divide-y divide-border/30">
            {leaderboardData.slice(3).map((player) => (
              <div key={player.rank} className="grid grid-cols-12 items-center p-4 hover:bg-muted/30 transition-colors">
                <div className="col-span-2">
                  <span className="font-display font-bold text-lg text-muted-foreground">#{player.rank}</span>
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                  <span className="font-medium text-foreground">{player.name}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="font-display font-semibold text-primary">{player.score.toLocaleString()}</span>
                </div>
                <div className="col-span-1 flex justify-center">
                  {player.change === "up" && <TrendingUp className="w-4 h-4 text-neon-green" />}
                  {player.change === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
                  {player.change === "same" && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;