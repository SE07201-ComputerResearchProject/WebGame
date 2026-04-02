import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletModal from "@/components/WalletModal";
import api from "@/lib/api";
import { 
  ShieldAlert, Activity, Server, Search, Sun, Moon, 
  Users, CreditCard, FileText, Edit, Ban, CheckCircle, DollarSign, Gamepad2, Play 
} from "lucide-react";
import authStore from "@/lib/auth";
import { Navigate } from "react-router-dom";

// --- INTERFACES ---
interface AdminLog { id: number; created_at: string; username: string; action: string; description: string; ip_address: string; }
interface User { id: number; username: string; email: string; role: string; balance: number; status: 'active' | 'banned'; created_at: string; }
interface Transaction { id: number; transaction_code: string; username: string; amount: number; type: string; status: 'success' | 'pending' | 'failed'; created_at: string; }
interface GameConfig { id: number; title: string; price: number; ad_duration: number; is_active: boolean; created_at: string; }

const AdminPage = () => {
  // --- STATES CHÍNH ---
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'transactions' | 'games'>('logs');
  const [searchTerm, setSearchTerm] = useState("");
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isLight, setIsLight] = useState(true); 
  
  // --- DATA STATES ---
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [games, setGames] = useState<GameConfig[]>([]);
  
  // --- STATES MODAL EDIT GAME ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameConfig | null>(null);

  const currentUser = authStore.getUser();
  if (!currentUser || currentUser.role !== 'admin') return <Navigate to="/" />;

  // --- HÀM XỬ LÝ LƯU GAME ---
  const handleSaveGameConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;
    
    try {
      const res = await api.updateGameConfig(editingGame.id, {
        price: editingGame.price,
        ad_duration: editingGame.ad_duration,
        is_active: editingGame.is_active
      });

      if (res?.ok) {
        setGames(games.map(g => g.id === editingGame.id ? editingGame : g));
        setIsEditModalOpen(false);
        alert(`Đã lưu cấu hình thành công cho game: ${editingGame.title}`); 
      } else {
        alert("Lưu thất bại: " + res?.message);
      }
    } catch (error) {
      console.error("Lỗi khi lưu game:", error);
      alert("Có lỗi kết nối khi lưu cấu hình!");
    }
  };

  //state modal balance
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceChangeAmount, setBalanceChangeAmount] = useState<number>(0);

  // 1. Hàm Xử lý Cộng/Trừ tiền
  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.updateUserBalance(selectedUser.id, balanceChangeAmount);
      if (res?.ok) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: u.balance + balanceChangeAmount } : u));
        setIsBalanceModalOpen(false);
        alert(`Cập nhật số dư thành công cho ${selectedUser.username}!`);
      } else {
        alert("Lỗi: " + res?.message);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối khi cập nhật số dư!");
    }
  };

  // 2. Hàm Xử lý Đổi Quyền (Admin <-> User)
  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Bạn có chắc muốn đổi quyền của [${user.username}] thành [${newRole.toUpperCase()}]?`)) return;
    
    try {
      const res = await api.updateUserRole(user.id, newRole);
      if (res?.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      } else alert("Lỗi: " + res?.message);
    } catch (error) {
      alert("Lỗi kết nối!");
    }
  };

  // 3. Hàm Xử lý Khóa/Mở Khóa
  const handleToggleStatus = async (user: User) => {
    const currentStatus = user.status || 'active'; // Fix an toàn
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const actionName = newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản [${user.username}]?`)) return;

    try {
      const res = await api.updateUserStatus(user.id, newStatus);
      if (res?.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      } else alert("Lỗi: " + res?.message);
    } catch (error) {
      alert("Lỗi kết nối!");
    }
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'logs') {
          const res = await api.getAdminLogs();
          if (res?.ok) setLogs(res.logs || []);
        } else if (activeTab === 'users') {
          const res = await api.getAdminUsers();
          if (res?.ok) setUsers(res.users || []);
        } else if (activeTab === 'transactions') {
          const res = await api.getAdminTransactions();
          if (res?.ok) setTransactions(res.transactions || []);
        } else if (activeTab === 'games') {
          const res = await api.getAdminGames();
          if (res?.ok) setGames(res.games || []);
        }
      } catch (error) { console.error("Lỗi tải dữ liệu Admin:", error); }
    };
    fetchData();
  }, [activeTab]);

  // --- HELPERS ---
  const getBadgeStyle = (actionOrStatus: string, type: 'log' | 'status' = 'log') => {
    if (!actionOrStatus) return isLight ? "bg-zinc-300/50 text-zinc-700" : "bg-zinc-800 text-zinc-300"; // Chống sập
    const text = actionOrStatus.toUpperCase();
    if (text.includes('SUCCESS') || text === 'ACTIVE') return isLight ? "bg-emerald-200/50 text-emerald-800 border-emerald-300/50" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (text.includes('FAIL') || text.includes('ERROR') || text === 'BANNED' || text === 'MAINTENANCE') return isLight ? "bg-red-200/50 text-red-800 border-red-300/50" : "bg-red-500/10 text-red-400 border-red-500/20";
    if (text.includes('PENDING')) return isLight ? "bg-amber-200/50 text-amber-800 border-amber-300/50" : "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (text.includes('TOPUP') || text.includes('PAYMENT') || text.includes('LOGIN') || text.includes('REGISTER') || text === 'FREE') return isLight ? "bg-blue-200/50 text-blue-800 border-blue-300/50" : "bg-blue-500/10 text-blue-400 border-blue-500/20";
    return isLight ? "bg-zinc-300/50 text-zinc-700 border-zinc-400/50" : "bg-zinc-800 text-zinc-300 border-zinc-700";
  };
  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  // ==========================================
  // CÁC HÀM RENDER TỪNG TAB
  // ==========================================

  const renderLogsTab = () => {
    // Thêm (log.action || "") để chống lỗi NULL
    const filteredLogs = logs.filter(log => (log.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <table className="w-full text-left text-sm relative">
        <thead className={`sticky top-0 z-10 backdrop-blur-md text-xs uppercase font-bold tracking-widest ${isLight ? 'bg-zinc-200/90 text-zinc-600 border-b border-zinc-300' : 'bg-zinc-900/90 text-zinc-500'}`}>
          <tr><th className="px-6 py-5">Thời gian</th><th className="px-6 py-5">Tài khoản</th><th className="px-6 py-5">Hành động</th><th className="px-6 py-5">Mô tả chi tiết</th><th className="px-6 py-5">IP Address</th></tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
          {filteredLogs.map((log) => (
            <tr key={log.id} className={`transition-colors font-medium group ${isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-zinc-800/40'}`}>
              <td className={`px-6 py-4 whitespace-nowrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
              <td className={`px-6 py-4 transition-colors ${isLight ? 'text-zinc-900 group-hover:text-red-600' : 'text-zinc-200 group-hover:text-red-400'}`}>{log.username || <span className="italic opacity-50">Khách</span>}</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border ${getBadgeStyle(log.action)}`}>{log.action}</span></td>
              <td className={`px-6 py-4 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>{log.description}</td>
              <td className={`px-6 py-4 font-mono text-xs whitespace-nowrap ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>{log.ip_address || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderUsersTab = () => {
    // BỌC CHỐNG LỖI NULL KHI SEARCH
    const filteredUsers = users.filter(user => 
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <table className="w-full text-left text-sm relative">
        <thead className={`sticky top-0 z-10 backdrop-blur-md text-xs uppercase font-bold tracking-widest ${isLight ? 'bg-zinc-200/90 text-zinc-600 border-b border-zinc-300' : 'bg-zinc-900/90 text-zinc-500'}`}>
          <tr><th className="px-6 py-5">ID / Ngày tạo</th><th className="px-6 py-5">Tài khoản</th><th className="px-6 py-5">Quyền</th><th className="px-6 py-5">Số dư (VNĐ)</th><th className="px-6 py-5">Trạng thái</th><th className="px-6 py-5 text-right">Thao tác</th></tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
          {filteredUsers.map((user) => {
            const userStatus = user.status || 'active'; // Nếu Database là NULL, ép nó thành 'active'
            
            return (
              <tr key={user.id} className={`transition-colors font-medium group ${isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-zinc-800/40'}`}>
                <td className={`px-6 py-4 whitespace-nowrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  <div className="font-bold text-zinc-500">#{user.id}</div><div className="text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}</div>
                </td>
                <td className={`px-6 py-4 transition-colors ${isLight ? 'text-zinc-900 group-hover:text-red-600' : 'text-zinc-200 group-hover:text-red-400'}`}>
                  <div className="font-bold text-base">{user.username}</div><div className="text-xs opacity-70">{user.email}</div>
                </td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-zinc-500/20 text-zinc-500'}`}>{user.role || 'user'}</span></td>
                <td className="px-6 py-4 font-bold text-emerald-500">{formatCurrency(user.balance)}</td>
                
                {/* HIỂN THỊ STATUS ĐÃ ĐƯỢC CHỐNG LỖI */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border ${getBadgeStyle(userStatus, 'status')}`}>
                    {userStatus.toUpperCase()}
                  </span>
                </td>
                
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  <button onClick={() => { setSelectedUser(user); setBalanceChangeAmount(0); setIsBalanceModalOpen(true); }} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors" title="Cộng/Trừ tiền"><DollarSign className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleRole(user)} className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500 hover:text-white transition-colors" title="Đổi quyền Admin/User"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleStatus(user)} className={`p-2 rounded-lg transition-colors ${userStatus === 'banned' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`} title={userStatus === 'banned' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}>
                    {userStatus === 'banned' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderTransactionsTab = () => {
    // BỌC CHỐNG LỖI NULL KHI SEARCH
    const filteredTrans = transactions.filter(t => 
      (t.transaction_code || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (t.username || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
      <table className="w-full text-left text-sm relative">
        <thead className={`sticky top-0 z-10 backdrop-blur-md text-xs uppercase font-bold tracking-widest ${isLight ? 'bg-zinc-200/90 text-zinc-600 border-b border-zinc-300' : 'bg-zinc-900/90 text-zinc-500'}`}>
          <tr><th className="px-6 py-5">Mã GD / Thời gian</th><th className="px-6 py-5">Tài khoản</th><th className="px-6 py-5">Loại giao dịch</th><th className="px-6 py-5">Số tiền</th><th className="px-6 py-5">Trạng thái</th></tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
          {filteredTrans.map((t) => (
            <tr key={t.id} className={`transition-colors font-medium group ${isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-zinc-800/40'}`}>
              <td className={`px-6 py-4 whitespace-nowrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <div className="font-bold text-zinc-500">{t.transaction_code}</div><div className="text-xs">{t.created_at ? new Date(t.created_at).toLocaleString('vi-VN') : ''}</div>
              </td>
              <td className={`px-6 py-4 transition-colors ${isLight ? 'text-zinc-900 group-hover:text-red-600' : 'text-zinc-200 group-hover:text-red-400'}`}>{t.username}</td>
              <td className={`px-6 py-4 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>{t.type}</td>
              <td className={`px-6 py-4 font-bold ${t.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{t.amount > 0 ? '+' : ''}{formatCurrency(t.amount)}</td>
              <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border ${getBadgeStyle(t.status || 'success', 'status')}`}>{(t.status || 'SUCCESS').toUpperCase()}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderGamesTab = () => {
    // BỌC CHỐNG LỖI NULL KHI SEARCH
    const filteredGames = games.filter(g => (g.title || "").toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <table className="w-full text-left text-sm relative">
        <thead className={`sticky top-0 z-10 backdrop-blur-md text-xs uppercase font-bold tracking-widest ${isLight ? 'bg-zinc-200/90 text-zinc-600 border-b border-zinc-300' : 'bg-zinc-900/90 text-zinc-500'}`}>
          <tr><th className="px-6 py-5">ID / Tên Game</th><th className="px-6 py-5">Giá Vĩnh Viễn</th><th className="px-6 py-5">Chế độ Quảng Cáo</th><th className="px-6 py-5">Trạng thái</th><th className="px-6 py-5 text-right">Cấu hình</th></tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-zinc-200' : 'divide-zinc-800/60'}`}>
          {filteredGames.map((game) => (
            <tr key={game.id} className={`transition-colors font-medium group ${isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-zinc-800/40'}`}>
              <td className={`px-6 py-4 whitespace-nowrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <div className="font-bold text-zinc-500">#{game.id}</div><div className={`font-bold text-base ${isLight ? 'text-zinc-900' : 'text-zinc-200'}`}>{game.title}</div>
              </td>
              <td className="px-6 py-4">
                {game.price === 0 ? <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getBadgeStyle('FREE')}`}>MIỄN PHÍ</span> : <span className="font-bold text-emerald-500">{formatCurrency(game.price)}</span>}
              </td>
              <td className="px-6 py-4">
                {game.ad_duration === 0 ? <span className="text-xs text-zinc-500 italic">Không áp dụng</span> : <div className="flex items-center gap-2"><Play className="w-4 h-4 text-amber-500" fill="currentColor" /><span className="font-bold text-amber-500">{game.ad_duration} Phút / 1 QC</span></div>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border ${getBadgeStyle(game.is_active ? 'ACTIVE' : 'MAINTENANCE', 'status')}`}>{game.is_active ? 'ĐANG BÁN' : 'TẠM ẨN'}</span></td>
              <td className="px-6 py-4 text-right">
                <button onClick={() => { setEditingGame(game); setIsEditModalOpen(true); }} className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500 hover:text-white transition-colors" title="Chỉnh sửa giá & QC"><Edit className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-950 text-zinc-300'}`}>
      <Navbar onAuthClick={() => {}} onWalletClick={() => setIsWalletOpen(true)} />
      
      <main className="flex-1 container mx-auto pt-32 pb-12 px-4 relative z-10">
        
        {/* HEADER & NÚT TOGGLE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors shadow-lg ${isLight ? 'bg-zinc-100 border-zinc-300 shadow-zinc-400/30' : 'bg-zinc-900 border-zinc-800 shadow-black/50'}`}>
              <ShieldAlert className={`w-8 h-8 ${isLight ? 'text-red-600' : 'text-red-500'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className={`mt-1 font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-500'}`}>Trung tâm giám sát hệ thống Nexus Games</p>
            </div>
          </div>
          <button onClick={() => setIsLight(!isLight)} className={`p-3 self-start md:self-auto rounded-xl border transition-all hover:scale-105 active:scale-95 ${isLight ? 'bg-zinc-100 border-zinc-300 text-amber-600 shadow-sm' : 'bg-zinc-800 border-zinc-700 text-zinc-400 shadow-md'}`}>
            {isLight ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* BỘ CHUYỂN TAB 4 MỤC */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'logs' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : isLight ? 'bg-zinc-300/50 text-zinc-600 hover:bg-zinc-300' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'}`}>
            <FileText className="w-4 h-4" /> Nhật ký (Logs)
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : isLight ? 'bg-zinc-300/50 text-zinc-600 hover:bg-zinc-300' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'}`}>
            <Users className="w-4 h-4" /> Người dùng
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'transactions' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : isLight ? 'bg-zinc-300/50 text-zinc-600 hover:bg-zinc-300' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'}`}>
            <CreditCard className="w-4 h-4" /> Giao dịch
          </button>
          <button onClick={() => setActiveTab('games')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'games' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : isLight ? 'bg-zinc-300/50 text-zinc-600 hover:bg-zinc-300' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700'}`}>
            <Gamepad2 className="w-4 h-4" /> Quản lý Game
          </button>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-colors ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80'}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLight ? 'bg-zinc-200/50 border-zinc-300' : 'bg-zinc-800/30 border-zinc-800/60'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLight ? 'bg-zinc-300/50' : 'bg-zinc-800'}`}>
                {activeTab === 'logs' && <Server className={`w-5 h-5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />}
                {activeTab === 'users' && <Users className={`w-5 h-5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />}
                {activeTab === 'transactions' && <Activity className={`w-5 h-5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />}
                {activeTab === 'games' && <Gamepad2 className={`w-5 h-5 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`} />}
              </div>
              <h2 className="font-bold text-lg">
                {activeTab === 'logs' ? 'System Activity Logs' : activeTab === 'users' ? 'User Management' : activeTab === 'transactions' ? 'Transaction History' : 'Game Inventory & Pricing'}
              </h2>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`} />
              <input 
                type="text" 
                placeholder={`Tìm kiếm ${activeTab === 'users' ? 'người dùng' : activeTab === 'transactions' ? 'mã giao dịch' : activeTab === 'games' ? 'tên game' : 'giao dịch, người dùng'}...`}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all font-medium text-sm ${isLight ? 'bg-zinc-200/50 border-zinc-300 focus:border-red-500/50 text-zinc-900' : 'bg-zinc-950/50 border-zinc-800 focus:border-red-500/50 text-zinc-200'}`}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
            {activeTab === 'logs' && renderLogsTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'transactions' && renderTransactionsTab()}
            {activeTab === 'games' && renderGamesTab()}
          </div>
        </div>
      </main>

      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
        
      {/* MODAL CỘNG/TRỪ TIỀN USER */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-blue-500" /> Điều chỉnh số dư</h3>
              <button onClick={() => setIsBalanceModalOpen(false)} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">✕</button>
            </div>
            
            <div className={`p-3 rounded-xl mb-4 text-sm ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
              <p>Tài khoản: <span className="font-bold">{selectedUser.username}</span></p>
              <p>Số dư hiện tại: <span className="font-bold text-emerald-500">{formatCurrency(selectedUser.balance)}</span></p>
            </div>

            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>Số tiền thay đổi (VNĐ)</label>
                <input 
                  type="number" 
                  step="1000"
                  value={balanceChangeAmount} 
                  onChange={(e) => setBalanceChangeAmount(Number(e.target.value))} 
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold ${isLight ? 'bg-white border-zinc-300' : 'bg-zinc-950 border-zinc-700 text-zinc-100'}`} 
                />
                <p className="text-xs text-zinc-500 mt-2 italic">* Nhập số dương (VD: 50000) để cộng tiền.<br/>* Nhập số âm (VD: -20000) để trừ tiền.</p>
              </div>
              <button type="submit" className="w-full py-3 mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-colors">
                Xác nhận
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT GAME */}
      {isEditModalOpen && editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-700'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Gamepad2 className="w-6 h-6 text-red-500" /> Cấu hình Game</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveGameConfig} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>Tên Game</label>
                <input type="text" value={editingGame.title} disabled className={`w-full px-4 py-2.5 rounded-xl border font-bold opacity-70 ${isLight ? 'bg-zinc-200 border-zinc-300' : 'bg-zinc-800 border-zinc-700'}`} />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>Giá mở khóa vĩnh viễn (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="number" min="0" step="1000" value={editingGame.price} onChange={(e) => setEditingGame({...editingGame, price: Number(e.target.value)})} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold ${isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-700 text-zinc-100'}`} />
                </div>
                <p className="text-xs text-zinc-500 mt-1 italic">*Nhập 0 để cho phép chơi miễn phí hoàn toàn.</p>
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1 ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>Thời gian chơi / 1 Quảng cáo (Phút)</label>
                <div className="relative">
                  <Play className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type="number" min="0" value={editingGame.ad_duration} onChange={(e) => setEditingGame({...editingGame, ad_duration: Number(e.target.value)})} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold ${isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-zinc-950 border-zinc-700 text-zinc-100'}`} />
                </div>
                <p className="text-xs text-zinc-500 mt-1 italic">*Nhập 0 nếu không cho phép chơi bằng cách xem QC.</p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-500/30 mt-4">
                <div><p className="font-bold text-sm">Trạng thái kinh doanh</p><p className="text-xs text-zinc-500">Cho phép người dùng thấy và mua game</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={editingGame.is_active} onChange={(e) => setEditingGame({...editingGame, is_active: e.target.checked})} />
                  <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <button type="submit" className="w-full py-3 mt-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 transition-colors">Lưu cấu hình</button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default AdminPage;