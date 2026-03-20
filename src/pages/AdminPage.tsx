import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { ShieldAlert, Activity, Users, Server } from "lucide-react";
import authStore from "@/lib/auth";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const currentUser = authStore.getUser();

  // Bảo vệ vòng ngoài: Nếu không phải admin thì đá về trang chủ
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    api.getAdminLogs().then(res => {
      if (res?.ok) setLogs(res.logs);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onAuthClick={() => {}} onWalletClick={() => {}} />
      
      <main className="flex-1 container mx-auto pt-24 pb-12 px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center border border-destructive/50">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Trung tâm giám sát hệ thống Nexus Games</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">System Activity Logs</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Thời gian</th>
                  <th className="px-6 py-4 font-medium">Tài khoản</th>
                  <th className="px-6 py-4 font-medium">Hành động</th>
                  <th className="px-6 py-4 font-medium">Mô tả chi tiết</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-neon-green">
                      {log.username || <span className="text-muted-foreground italic">Khách vãng lai</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.description}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{log.ip_address || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && <div className="p-8 text-center text-muted-foreground">Chưa có dữ liệu log.</div>}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default AdminPage;