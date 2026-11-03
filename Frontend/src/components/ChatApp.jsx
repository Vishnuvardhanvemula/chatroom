import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Moon, Sun, Users, Wifi, WifiOff, LogOut, Hash, ShieldCheck } from "lucide-react";

import { UsernamePrompt } from "./UsernamePrompt";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { UserSidebar } from "./UserSidebar";
import { useSocket } from "../hooks/useSocket";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Toaster } from "./ui/sonner";
import { RoomList } from "./RoomList";
import { useAuth } from "./auth/AuthProvider";
import { API_BASE_URL } from "../config/api";

export default function ChatApp() {
  const [username, setUsername] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    messages,
    users,
    typingUsers,
    isConnected,
    socket,
    sendMessage,
    emitTyping,
    emitStopTyping,
    deleteMessage,
    pinMessage,
    muteUser,
    unmuteUser,
    blockUser,
    unblockUser,
    editMessage,
  } = useSocket(username, currentRoom?._id);

  const currentUser = users.find((u) => u.username === username);
  const isModerator = currentUser?.isModerator || false;
  const isMuted = currentUser?.isMuted || false;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!username) return;

    fetch(`${API_BASE_URL}/api/rooms`)
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error);
        }
        return res.json();
      })
      .then(setRooms)
      .catch((error) => {
        console.error("Failed to load rooms:", error);
      });

    if (socket) {
      socket.on("roomCreated", (newRoom) => {
        setRooms((prev) => {
          if (prev.some((r) => r._id === newRoom._id)) return prev;
          return [...prev, newRoom];
        });
      });

      return () => {
        socket.off("roomCreated");
      };
    }
  }, [username, socket]);

  const handleCreateRoom = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, createdBy: username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }

      const newRoom = await response.json();
      setRooms((prev) => [...prev, newRoom]);
      return newRoom;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const { user } = useAuth();
  
  // Use authenticated user's information
  useEffect(() => {
    if (user && !username) {
      setUsername(user.username);
    }
  }, [user, username]);

  if (!currentRoom) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <RoomList
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomSelect={setCurrentRoom}
            onCreateRoom={handleCreateRoom}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-row overflow-hidden bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Toaster position="top-right" />

      {/* Left Navigation Sidebar */}
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="hidden md:flex w-64 lg:w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800/80 flex-col justify-between h-full shadow-sm z-10 transition-colors"
      >
        {/* Top: Current Room Info & Connection */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0 font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentRoom.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Welcome, {username}
              </p>
            </div>
          </div>

          {/* Connection status pill */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 w-full">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">Connected to chat server</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Middle: Quick Room Switcher */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
            Current Room
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-sm border border-indigo-200/60 dark:border-indigo-800/50">
            <Hash className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="truncate">{currentRoom.name}</span>
          </div>

          {rooms.filter((r) => r._id !== currentRoom._id).length > 0 && (
            <div className="pt-3">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                Other Rooms
              </div>
              <div className="space-y-1 mt-1">
                {rooms
                  .filter((r) => r._id !== currentRoom._id)
                  .map((r) => (
                    <button
                      key={r._id}
                      onClick={() => setCurrentRoom(r)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm transition-colors text-left"
                    >
                      <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {/* User status card */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium flex items-center justify-center text-xs shadow-sm shrink-0">
              {username ? username[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                {username}
                {isModerator && (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                {isModerator ? 'Moderator' : 'Member'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-center gap-1.5"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentRoom(null)}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Rooms</span>
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-2.5 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentRoom(null)}
              className="px-2 text-xs text-slate-600 dark:text-slate-300"
            >
              ← Rooms
            </Button>
            <span className="font-semibold text-sm truncate text-slate-800 dark:text-slate-100">
              #{currentRoom.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-full h-8 w-8 text-slate-600 dark:text-slate-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                >
                  <Users className="w-3.5 h-3.5 mr-1" />
                  {users.length}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-80">
                <UserSidebar
                  users={users}
                  currentUsername={username}
                  isModerator={isModerator}
                  onMuteUser={muteUser}
                  onUnmuteUser={unmuteUser}
                  onBlockUser={blockUser}
                  onUnblockUser={unblockUser}
                  onClose={() => setIsSidebarOpen(false)}
                  isMobile={true}
                  socket={socket}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Chat Feed & Message Input */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#090d16] transition-colors">
            <ChatWindow
              messages={messages}
              currentUsername={username}
              typingUsers={typingUsers}
              isModerator={isModerator}
              onDeleteMessage={deleteMessage}
              onPinMessage={pinMessage}
              onEditMessage={editMessage}
              socket={socket}
              roomId={currentRoom._id}
            />
            <MessageInput
              onSendMessage={sendMessage}
              onTyping={emitTyping}
              onStopTyping={emitStopTyping}
              isMuted={isMuted}
            />
          </div>

          {/* Desktop Right User Sidebar */}
          {!isMobile && (
            <div className="w-72 lg:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800/80">
              <UserSidebar
                users={users}
                currentUsername={username}
                isModerator={isModerator}
                onMuteUser={muteUser}
                onUnmuteUser={unmuteUser}
                onBlockUser={blockUser}
                onUnblockUser={unblockUser}
                socket={socket}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
