import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletModal from "@/components/WalletModal";
import api from "@/lib/api";
import { ShieldAlert, Activity, Server, Search, Sun, Moon } from "lucide-react";
import authStore from "@/lib/auth";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  
  // CÔNG TẮC 2 CHẾ ĐỘ
  const [isLight, setIsLight] = useState(true); 
  
  const currentUser = authStore.getUser();

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    api.getAdminLogs().then(res => {
      if (res?.ok) setLogs(res.logs);
    });
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const username = (log.username || "").toLowerCase();
    const action = (log.action || "").toLowerCase();
    return username.includes(searchLower) || action.includes(searchLower);
  });

  // Cấu hình màu sắc Badge (Màu công nghiệp cho hệ thống xi măng)
  const getBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('TOPUP') || act.includes('PAYMENT')) {
      return isLight 
        ? "bg-emerald-200/50 text-emerald-800 border-emerald-300/50" 
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (act.includes('FAIL') || act.includes('ERROR') || act.includes('BAN')) {
      return isLight 
        ? "bg-red-200/50 text-red-800 border-red-300/50" 
        : "bg-red-500/10 text-red-400 border-red-500/20";
    }
    if (act.includes('LOGIN') || act.includes('REGISTER')) {
      return isLight 
        ? "bg-blue-200/50 text-blue-800 border-blue-300/50" 
        : "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    return isLight 
      ? "bg-zinc-300/50 text-zinc-700 border-zinc-400/50" 
      : "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    /* NỀN XI MĂNG (ZINC) MANG ĐẬM CHẤT MSI */
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-950 text-zinc-300'}`}>
      
      <Navbar onAuthClick={() => {}} onWalletClick={() => setIsWalletOpen(true)} />
      
      <main className="flex-1 container mx-auto pt-24 pb-12 px-4 relative z-10">
        
        {/* HEADER & NÚT TOGGLE */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors shadow-lg ${isLight ? 'bg-zinc-100 border-zinc-300 shadow-zinc-400/30' : 'bg-zinc-900 border-zinc-800 shadow-black/50'}`}>
              {/* Icon màu Đỏ MSI siêu ngầu */}
              <ShieldAlert className={`w-8 h-8 ${isLight ? 'text-red-600' : 'text-red-500'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className={`mt-1 font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>Trung tâm giám sát hệ thống Nexus Games</p>
            </div>
          </div>

          <button 
            onClick={() => setIsLight(!isLight)}
            className={`p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isLight ? 'bg-zinc-100 border-zinc-300 text-amber-600 shadow-sm' : 'bg-zinc-800 border-zinc-700 text-zinc-400 shadow-md'}`}
            title="Đổi giao diện Sáng/Tối"
          >
            {isLight ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* BẢNG LOG - KHỐI XI MĂNG NỔI */}
        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-colors ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80'}`}>
          
          {/* THANH TÌM KIẾM */}
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLight ? 'bg-zinc-200/50 border-zinc-300' : 'bg-zinc-800/30 border-zinc-800/60'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLight ? 'bg-zinc-300/50' : 'bg-zinc-800'}`}>
                <Server className={`w-5 h-5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />
              </div>
              <h2 className="font-bold text-lg">System Activity Logs</h2>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`} />
              <input 
                type="text" 
                placeholder="Tìm kiếm giao dịch, người dùng..." 
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all font-medium text-sm ${
                  isLight 
                  ? 'bg-zinc-200/50 border-zinc-300 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 placeholder:text-zinc-500 text-zinc-900' 
                  : 'bg-zinc-950/50 border-zinc-800 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 placeholder:text-zinc-600 text-zinc-200'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* TABLE DATA */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm relative">
              <thead className={`sticky top-0 z-10 backdrop-blur-md text-xs uppercase font-bold tracking-widest ${isLight ? 'bg-zinc-200/90 text-zinc-600 border-b border-zinc-300' : 'bg-zinc-900/90 text-zinc-500'}`}>
                <tr>
                  <th className="px-6 py-5">Thời gian</th>
                  <th className="px-6 py-5">Tài khoản</th>
                  <th className="px-6 py-5">Hành động</th>
                  <th className="px-6 py-5">Mô tả chi tiết</th>
                  <th className="px-6 py-5">IP Address</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className={`transition-colors font-medium group ${isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-zinc-800/40'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className={`px-6 py-4 transition-colors ${isLight ? 'text-zinc-900 group-hover:text-red-600' : 'text-zinc-200 group-hover:text-red-400'}`}>
                      {log.username || <span className="italic opacity-50">Khách</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border ${getBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>{log.description}</td>
                    <td className={`px-6 py-4 font-mono text-xs whitespace-nowrap ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>{log.ip_address || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredLogs.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center gap-3">
                <div className={`p-4 rounded-xl ${isLight ? 'bg-zinc-200' : 'bg-zinc-800/30'}`}>
                  <Activity className={`w-8 h-8 ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`} />
                </div>
                <p className={`font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>Không có dữ liệu phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <Footer />
    </div>
  );
};

export default AdminPage;