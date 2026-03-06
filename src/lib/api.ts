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

export async function register(payload: { username: string; email: string; password: string }) {
  return postJSON("/api/auth/register", payload);
}

export async function login(payload: { email: string; password: string }) {
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

export default { register, login, getGames, getFriends, getLeaderboard, submitScore, addFriend, createSocket, getSocket };
