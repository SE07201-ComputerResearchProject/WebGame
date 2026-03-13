import { Lock, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SubmitScoreModal from "./SubmitScoreModal";
import auth from "@/lib/auth";

interface GameCardProps {
  title: string;
  image: string;
  category: string;
  rating: number;
  players: number;
  price?: number;
  isLocked?: boolean;
  isFeatured?: boolean;
  isCompact?: boolean;
}

const GameCard = ({ 
  title, 
  image, 
  category, 
  rating, 
  players, 
  price, 
  isLocked = false,
  isFeatured = false,
  isCompact = false
}: GameCardProps) => {
  const [showSubmit, setShowSubmit] = useState(false);
  const navigate = useNavigate();
  return (
    <div className={`game-card group cursor-pointer ${isFeatured && !isCompact ? 'col-span-2 row-span-2' : ''}`}>
      {/* Image */}
      <div className={`relative overflow-hidden ${isCompact ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Lock Icon */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1">
              <div className={`rounded-full bg-muted/80 flex items-center justify-center ${isCompact ? 'w-10 h-10' : 'w-16 h-16'}`}>
                <Lock className={`text-muted-foreground ${isCompact ? 'w-5 h-5' : 'w-8 h-8'}`} />
              </div>
              <span className={`font-medium text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
                {price ? `${price.toLocaleString()}đ` : 'Mở khóa'}
              </span>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className={`absolute ${isCompact ? 'top-2 left-2' : 'top-3 left-3'}`}>
          <span className={`font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
            {category}
          </span>
        </div>

        {/* Featured Badge */}
        {isFeatured && !isCompact && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-accent/20 text-accent border border-accent/30">
              Nổi bật
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={isCompact ? 'p-2' : 'p-4'}>
        <h3 className={`font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {title}
        </h3>
        
        <div className={`flex items-center justify-between ${isCompact ? 'mt-1.5' : 'mt-3'}`}>
          <div className={`flex items-center gap-2 text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center gap-1">
              <Star className={`text-neon-orange fill-neon-orange ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span>{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>{players >= 1000 ? `${(players/1000).toFixed(0)}k` : players}</span>
            </div>
          </div>
          
          {!isCompact && (
            isLocked ? (
              <Button variant="neon" size="sm">
                Mở khóa
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="gaming" size="sm" onClick={() => navigate('/play/1')}>
                  Chơi
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSubmit(true)}>
                  Gửi điểm
                </Button>
                <SubmitScoreModal isOpen={showSubmit} onClose={() => setShowSubmit(false)} defaultName={auth.getUser()?.username || ''} onSubmitted={() => {}} />
              </div>
            )
          )}
        </div>
        
        {/* Compact Play Button */}
        {isCompact && (
          <Button 
            variant={isLocked ? "neon" : "gaming"} 
            size="sm" 
            className="w-full mt-2 h-7 text-xs"
            onClick={() => !isLocked && navigate('/play/1')}
          >
            {isLocked ? 'Mở khóa' : 'Chơi ngay'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default GameCard;
