import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  onSubmitted?: (leaderboard: any[]) => void;
}

const SubmitScoreModal = ({ isOpen, onClose, defaultName = "", onSubmitted }: Props) => {
  const [name, setName] = useState(defaultName);
  const [score, setScore] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setName(defaultName); }, [defaultName]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !score) return toast({ title: "Lỗi", description: "Vui lòng nhập tên và điểm" });
    setLoading(true);
    try {
      const res = await api.submitScore({ name, score: Number(score) });
      if (res?.ok) {
        toast({ title: "Gửi điểm thành công" });
        onSubmitted && onSubmitted(res.leaderboard || []);
        onClose();
      } else {
        toast({ title: "Lỗi", description: res?.error || "Không thể gửi điểm" });
      }
    } catch (e) {
      toast({ title: "Lỗi", description: "Lỗi kết nối tới server" });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-md hover:bg-muted/50"><X className="w-4 h-4" /></button>
        <h3 className="font-semibold mb-4">Gửi điểm</h3>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên" className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
          <input value={score as any} onChange={(e) => setScore(e.target.value ? Number(e.target.value) : "")} type="number" placeholder="Điểm" className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/50" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Hủy</Button>
            <Button variant="gaming" onClick={handleSubmit} disabled={loading}>{loading ? 'Đang...' : 'Gửi'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitScoreModal;
