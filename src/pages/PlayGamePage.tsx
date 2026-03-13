import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Heart, Share, Star, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const PlayGamePage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Mock data - Games
  const gamesData: Record<string, any> = {
    '1': {
      title: "2048 - Puzzle Game",
      url: "https://gabrielecirulli.github.io/2048/",
      description: "2048 là một trò chơi câu đố slide rất phổ biến. Vùng chơi là một lưới 4×4 với các ô vuông có thể chứa các số. Mỗi lần người chơi di chuyển, tất cả các ô sẽ trượt theo hướng được chọn cho đến khi chúng chạm vào tường. Nếu hai ô có cùng một số, chúng sẽ hợp nhất thành một ô với tổng của chúng. Trò chơi kết thúc khi bạn không thể di chuyển hoặc đạt được 2048. Đây là một trò chơi tuyệt vời để rèn luyện trí tuệ và khả năng tính toán.",
      tags: ["Puzzle", "Strategy", "Brain"],
      rating: 4.8,
      players: 2500000
    }
  };
  
  const gameData = gamesData[id] || gamesData['1'];

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState([
    { id: 1, user: "User1", avatar: "", text: "Game hay quá!", time: "2 giờ trước" },
    { id: 2, user: "User2", avatar: "", text: "Thích game này lắm.", time: "1 giờ trước" }
  ]);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast({
      title: "Đã chia sẻ!",
      description: "Link game đã được sao chép vào clipboard.",
    });
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    toast({
      title: "Cảm ơn đánh giá!",
      description: `Bạn đã đánh giá ${rating} ⭐`,
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        user: "Bạn",
        avatar: "",
        text: newComment,
        time: "Vừa xong"
      };
      setComments([comment, ...comments]);
      setNewComment("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onAuthClick={() => {}} onWalletClick={() => {}} />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Back Button */}
        <div className="mb-6 flex items-center gap-2">
          <Link to="/games">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              Trang chủ
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Game Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border/50">
            <iframe
              src={gameData.url}
              className="w-full h-full"
              title={gameData.title}
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{ border: 'none' }}
            />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{gameData.title}</h1>
              <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-4 h-4 mr-1" />
                Chia sẻ
              </Button>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-0 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        (hoverRating || userRating || 0) >= star
                          ? "fill-neon-orange text-neon-orange"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

            {/* Description */}
            <div className="prose max-w-none">
              <p>{gameData.description}</p>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Bình luận</h2>
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback>{comment.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user}</span>
                        <span className="text-sm text-muted-foreground">{comment.time}</span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            <h3 className="font-semibold text-sm mb-2">Thống kê</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người chơi:</span>
                <span className="font-medium">{gameData.players?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đánh giá:</span>
                <span className="font-medium flex items-center gap-1"><Star className="w-3 h-3 fill-neon-orange text-neon-orange" /> {gameData.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayGamePage;