import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (friend: any) => void;
}

const AddFriendModal = ({ isOpen, onClose, onAdded }: Props) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!name.trim()) return toast({ title: "Lỗi", description: "Vui lòng nhập tên" });
    setLoading(true);
    try {
      const res = await api.addFriend({ name: name.trim(), avatar: avatar || undefined });
      if (res?.ok) {
        toast({ title: "Thành công", description: `${res.friend.name} đã được thêm` });
        onAdded && onAdded(res.friend);
        onClose();
      } else {
        toast({ title: "Lỗi", description: res?.error || "Không thể thêm bạn" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted/50"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><UserPlus className="w-5 h-5 text-primary" /></div>
          <h3 className="font-semibold">Thêm bạn mới</h3>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên" className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Avatar (URL, optional)" className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Hủy</Button>
            <Button variant="neon" onClick={handleAdd} disabled={loading}>{loading ? 'Đang...' : 'Thêm'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
