import { useState, useEffect } from "react";
import { X, Users, MessageCircle, UserPlus, Search, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Friend {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "offline" | "playing";
  game?: string;
}

import api from "@/lib/api";
import auth from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";
import AddFriendModal from "./AddFriendModal";

const initialFriends: Friend[] = [];

interface FriendsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (friend: Friend) => void;
}

const FriendsSidebar = ({ isOpen, onClose, onOpenChat }: FriendsSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [showAdd, setShowAdd] = useState(false);

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

  const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const onlineFriends = filteredFriends.filter(f => f.status !== "offline");
  const offlineFriends = filteredFriends.filter(f => f.status === "offline");

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 glass-card border-l border-border/50 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Bạn bè</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              {onlineFriends.length} online
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto scrollbar-gaming px-4 pb-4">
          {/* Online Friends */}
          {onlineFriends.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Đang hoạt động — {onlineFriends.length}
              </p>
              <div className="space-y-1">
                {onlineFriends.map(friend => (
                  <FriendItem key={friend.id} friend={friend} onChat={() => onOpenChat(friend)} />
                ))}
              </div>
            </div>
          )}

          {/* Offline Friends */}
          {offlineFriends.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Ngoại tuyến — {offlineFriends.length}
              </p>
              <div className="space-y-1">
                {offlineFriends.map(friend => (
                  <FriendItem key={friend.id} friend={friend} onChat={() => onOpenChat(friend)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Friend Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="neon"
            className="w-full"
            onClick={() => setShowAdd(true)}
          >
            <UserPlus className="w-4 h-4" />
            Thêm bạn bè
          </Button>
        </div>
        <AddFriendModal isOpen={showAdd} onClose={() => setShowAdd(false)} onAdded={(f) => setFriends((s) => [f, ...s])} />
      </aside>
    </>
  );
};

const FriendItem = ({ friend, onChat }: { friend: Friend; onChat: () => void }) => {
  const statusColor = {
    online: "text-neon-green",
    playing: "text-neon-cyan",
    offline: "text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer">
      <div className="relative">
        <img 
          src={friend.avatar}
          alt={friend.name}
          className={`w-10 h-10 rounded-full object-cover border-2 ${
            friend.status === "offline" ? "border-muted opacity-60" : "border-primary/50"
          }`}
        />
        <Circle 
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 fill-current ${statusColor[friend.status]}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${
          friend.status === "offline" ? "text-muted-foreground" : "text-foreground"
        }`}>
          {friend.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {friend.status === "playing" ? `Đang chơi ${friend.game}` : 
           friend.status === "online" ? "Trực tuyến" : "Ngoại tuyến"}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onChat(); }}
        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/50 text-muted-foreground hover:text-primary transition-all"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FriendsSidebar;
