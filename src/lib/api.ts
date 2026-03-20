import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";

const BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:4000";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function postJSON(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

// ===== CÁC HÀM GỌI API CƠ BẢN =====
export async function register(payload: { username: string; email: string; password: string; captchaToken?: string | null }) {
  return postJSON("/api/auth/register", payload);
}

export async function login(payload: { email: string; password: string; captchaToken?: string | null }) {
  return postJSON("/api/auth/login", payload);
}

export async function getGames() {
  const res = await fetch(`${BASE}/api/games`, { headers: authHeaders() });
  return res.json();
}

export async function getFriends() {
  const res = await fetch(`${BASE}/api/friends`, { headers: authHeaders() });
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE}/api/leaderboard`, { headers: authHeaders() });
  return res.json();
}

export async function submitScore(payload: { name: string; score: number }) {
  return postJSON("/api/leaderboard/submit", payload);
}

export async function addFriend(payload: { name: string; avatar?: string }) {
  return postJSON('/api/friends/add', payload);
}

// ===== 3 HÀM XỬ LÝ BẢO MẬT MFA (VỪA ĐƯỢC BỔ SUNG) =====
export async function verifyMfaLogin(payload: { tempToken: string; code: string }) {
  return postJSON("/api/auth/login/mfa", payload);
}

export async function setupMfa() {
  const res = await fetch(`${BASE}/api/auth/mfa/setup`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
}

export async function enableMfa(payload: { code: string }) {
  return postJSON("/api/auth/mfa/enable", payload);
}

export async function getMfaStatus() {
  const res = await fetch(`${BASE}/api/auth/mfa/status`, { headers: authHeaders() });
  return res.json();
}

export async function disableMfa(payload: { code: string }) {
  return postJSON("/api/auth/mfa/disable", payload);
}

// ===== CẤU HÌNH WEBSOCKET =====
let _socket: Socket | null = null;
export function createSocket() {
  if (_socket) return _socket;
  const token = getToken();
  _socket = io(BASE, { transports: ["websocket"], autoConnect: true, auth: { token } });
  return _socket;
}

export function getSocket() {
  return _socket;
}

export async function setupSmsMfa(payload: { phone: string }) {
  return postJSON("/api/auth/mfa/setup-sms", payload);
}

export async function enableSmsMfa(payload: { code: string }) {
  return postJSON("/api/auth/mfa/enable-sms", payload);
}

export async function requestDisableSms() {
  return postJSON("/api/auth/mfa/request-disable", {});
}

export async function googleLogin(credential: string) {
  return postJSON("/api/auth/google", { credential });
}

export async function getGlobalMessages() {
  const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  try {
    // Dùng trực tiếp API fetch chuẩn của trình duyệt
    const response = await fetch(`${baseUrl}/api/messages/global`);
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi gọi API lịch sử chat:", error);
    return { ok: false, messages: [] };
  }
}

// 1. Lấy danh bạ người chơi
export async function getUsers() {
  const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  try {
    const response = await fetch(`${baseUrl}/api/auth/users`);
    return await response.json();
  } catch (error) {
    return { ok: false, users: [] };
  }
}

// 2. Lấy lịch sử chat 1-1
export async function getPrivateMessages(friendId: number, myUserId: number) {
  const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  try {
    const response = await fetch(`${baseUrl}/api/messages/private/${friendId}?userId=${myUserId}`);
    return await response.json();
  } catch (error) {
    return { ok: false, messages: [] };
  }
}

export async function getFriendRequests() {
  const res = await fetch(`${BASE}/api/friends/requests`, { headers: authHeaders() });
  return res.json();
}
export async function sendFriendRequest(payload: { friendId: number }) {
  return postJSON('/api/friends/add', payload);
}
export async function acceptFriendRequest(payload: { requestId: number }) {
  return postJSON('/api/friends/accept', payload);
}

export async function getAdminLogs() {
  const res = await fetch(`${BASE}/api/admin/logs`, { headers: authHeaders() });
  return res.json();
}

// ===== XUẤT KHẨU TẤT CẢ ĐỂ CÁC FILE KHÁC DÙNG ĐƯỢC =====
export default { 
  register, 
  login, 
  getGames, 
  getFriends, 
  getLeaderboard, 
  submitScore, 
  addFriend, 
  createSocket, 
  getSocket,
  verifyMfaLogin,
  setupMfa,
  enableMfa,
  getMfaStatus,
  disableMfa,
  setupSmsMfa,
  enableSmsMfa,
  requestDisableSms,
  googleLogin,
  getGlobalMessages,
  getUsers,
  getPrivateMessages,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  getAdminLogs


};