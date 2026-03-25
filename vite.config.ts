import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Cho phép truy cập từ các tên miền map qua hosts
    port: 8080,
    strictPort: true,
    // (Tùy chọn) Nếu Vite báo lỗi "Invalid Host header", thêm dòng dưới:
    allowedHosts: ['nexusgames.local']
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    
  },

}));
