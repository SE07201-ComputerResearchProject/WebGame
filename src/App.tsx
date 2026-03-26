import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GamesPage from "./pages/GamesPage";
// import LeaderboardPage from "./pages/LeaderboardPage";
import FriendsPage from "./pages/FriendsPage";
import MessagesPage from "./pages/MessagesPage";
import NotFound from "./pages/NotFound";
import GamePlayer from "./components/GamePlayer";
import WalletReturn from './pages/WalletReturn'; // Nhớ import file vừa tạo nhé
import AdminPage from "./pages/AdminPage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/games" element={<GamesPage />} />
          {/* <Route path="/leaderboard" element={<LeaderboardPage />} /> */}
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          

          <Route path="/admin" element={<AdminPage />} />
          <Route path="/wallet/return" element={<WalletReturn />} /> {/* Route mới cho VNPay */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* GAME PLAYER PHẢI NẰM Ở ĐÂY */}
        <GamePlayer />

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import GamesPage from "./pages/GamesPage";
// import LeaderboardPage from "./pages/LeaderboardPage";
// import FriendsPage from "./pages/FriendsPage";
// import MessagesPage from "./pages/MessagesPage";
// import NotFound from "./pages/NotFound";
// import AdminPage from "./pages/AdminPage";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           <Route path="/games" element={<GamesPage />} />
//           <Route path="/leaderboard" element={<LeaderboardPage />} />
//           <Route path="/friends" element={<FriendsPage />} />
//           <Route path="/messages" element={<MessagesPage />} />
//           <Route path="/admin" element={<AdminPage />} />
//           <Route path="*" element={<NotFound />} />
          
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
