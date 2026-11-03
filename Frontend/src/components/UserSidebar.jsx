import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { User, Crown, Volume2, VolumeX, Ban, UserX, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PrivateChat } from './PrivateChat';

export function UserSidebar({
  users,
  currentUsername,
  isModerator,
  onMuteUser,
  onUnmuteUser,
  onBlockUser,
  onUnblockUser,
  onClose,
  isMobile,
  socket
}) {
  const [selectedChat, setSelectedChat] = useState(null);

  // Listen for custom event to open private chat
  useEffect(() => {
    const handleOpenChat = (event) => {
      setSelectedChat(event.detail.username);
    };

    window.addEventListener('openPrivateChat', handleOpenChat);
    return () => {
      window.removeEventListener('openPrivateChat', handleOpenChat);
    };
  }, []);
  // Group users by status
  const onlineUsers = users.filter(user => user.isOnline);
  const offlineUsers = users.filter(user => !user.isOnline);

  // Sort each group by moderator status and then username
  const sortByModAndName = (a, b) => {
    if (a.isModerator && !b.isModerator) return -1;
    if (!a.isModerator && b.isModerator) return 1;
    return a.username.localeCompare(b.username);
  };

  const sortedOnlineUsers = [...onlineUsers].sort(sortByModAndName);
  const sortedOfflineUsers = [...offlineUsers].sort(sortByModAndName);

  // Combine both groups with online users first
  const sortedUsers = [...sortedOnlineUsers, ...sortedOfflineUsers];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors">
      {isMobile && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 opacity-80">
          <Button onClick={onClose} variant="ghost" className="w-full justify-start">
            ← Back to Chat
          </Button>
        </div>
      )}

      <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <h2 className="text-lg font-semibold">
          Users ({users.length})
        </h2>
        <div className="flex gap-2 mt-1 text-sm">
          <span className="text-green-500">● {onlineUsers.length} Online</span>
          <span className="text-gray-500">● {offlineUsers.length} Offline</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Online Users Section */}
        {sortedOnlineUsers.length > 0 && (
          <div className="py-2 px-4 bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Online
          </div>
        )}
        {sortedOnlineUsers.map((user) => (
          <motion.div
            key={user.username}
            initial={isMobile ? { x: 20, opacity: 0 } : false}
            animate={isMobile ? { x: 0, opacity: 1 } : false}
            className={`p-3.5 flex items-center gap-3 border-b last:border-b-0 border-slate-100 dark:border-slate-800/60 transition-colors ${user.username === currentUsername ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: user.color || '#4B5563' }}
            >
              {user.isModerator ? (
                <Crown className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <span className="font-medium">
                  {user.username}
                  {user.username === currentUsername && ' (You)'}
                </span>
                {user.isModerator && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Mod
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  user.isOnline 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-gray-400'
                }`} />
                <span className={`text-sm ${
                  user.isOnline 
                    ? 'text-green-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {user.isOnline ? 'Active now' : 'Offline'}
                  {user.lastSeen && !user.isOnline && (
                    <span className="ml-1 text-xs text-gray-500">
                      • Last seen {new Date(user.lastSeen).toLocaleTimeString()}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {user.username !== currentUsername && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChat(user.username)}
                  className="h-8 w-8 p-0 hover:bg-indigo-500/20"
                  title="Send private message"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </Button>
              )}
              
              {isModerator && user.username !== currentUsername && !user.isModerator && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => user.isMuted ? onUnmuteUser(user.username) : onMuteUser(user.username)}
                    className="h-8 w-8 p-0 hover:bg-amber-500/15"
                    title={user.isMuted ? 'Unmute user' : 'Mute user'}
                  >
                    {user.isMuted ? (
                      <VolumeX className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => user.isBlocked ? onUnblockUser(user.username) : onBlockUser(user.username)}
                    className="h-8 w-8 p-0 hover:bg-red-500/15"
                    title={user.isBlocked ? 'Unblock user' : 'Block user'}
                  >
                    {user.isBlocked ? (
                      <UserX className="w-4 h-4 text-red-500" />
                    ) : (
                      <Ban className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ))}

        {/* Offline Users Section */}
        {sortedOfflineUsers.length > 0 && (
          <>
            <div className="py-2 px-4 bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Offline
            </div>
            {sortedOfflineUsers.map((user) => (
              <motion.div
                key={user.username}
                initial={isMobile ? { x: 20, opacity: 0 } : false}
                animate={isMobile ? { x: 0, opacity: 1 } : false}
                className={`p-4 flex items-center gap-3 border-b last:border-b-0 border-slate-100 dark:border-slate-800/60 opacity-80 ${
                  user.username === currentUsername ? 'bg-indigo-900/30' : ''
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white opacity-60"
                  style={{ backgroundColor: user.color || '#4B5563' }}
                >
                  {user.isModerator ? (
                    <Crown className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 opacity-60">
                    <span className="font-medium">
                      {user.username}
                      {user.username === currentUsername && ' (You)'}
                    </span>
                    {user.isModerator && (
                      <span className="text-xs bg-amber-100/50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                        Mod
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Offline
                      {user.lastSeen && (
                        <span className="ml-1 text-xs text-gray-500">
                          • Last seen {new Date(user.lastSeen).toLocaleTimeString()}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {user.username !== currentUsername && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChat(user.username)}
                      className="h-8 w-8 p-0 hover:bg-indigo-500/20"
                      title="Send private message"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                    </Button>
                  )}
                  
                  {isModerator && user.username !== currentUsername && !user.isModerator && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => user.isMuted ? onUnmuteUser(user.username) : onMuteUser(user.username)}
                        className="h-8 w-8 p-0 hover:bg-amber-500/15"
                        title={user.isMuted ? 'Unmute user' : 'Mute user'}
                      >
                        {user.isMuted ? (
                          <VolumeX className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => user.isBlocked ? onUnblockUser(user.username) : onBlockUser(user.username)}
                        className="h-8 w-8 p-0 hover:bg-red-500/15"
                        title={user.isBlocked ? 'Unblock user' : 'Block user'}
                      >
                        {user.isBlocked ? (
                          <UserX className="w-4 h-4 text-red-500" />
                        ) : (
                          <Ban className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Private Chat Window */}
      {selectedChat && (
        <PrivateChat
          socket={socket}
          currentUsername={currentUsername}
          recipient={selectedChat}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
}