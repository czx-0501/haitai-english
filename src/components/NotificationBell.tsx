import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, type NotificationItem } from '../utils/notifications';

export default function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    const items: any[] = [];

    // 1. Friend requests
    try {
      const user = await getCurrentUser();
      if (user?.id) {
        const { data: requests } = await supabase
          .from('friend_requests')
          .select('*, from_user:from_user_id (nickname)')
          .eq('to_user_id', user.id)
          .eq('status', 'pending');
        if (requests) {
          requests.forEach((r: any) => {
            items.push({
              id: 'fr_' + r.id,
              type: 'friend_request',
              title: '好友请求',
              message: `${r.from_user?.nickname || '某人'} 请求添加好友`,
              time: r.created_at,
              read: false,
            });
          });
        }
      }
    } catch {}

    // 2. Local notifications (learning, quiz, achievements)
    const local = getNotifications();
    local.forEach(n => {
      items.push({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: new Date(n.timestamp).toISOString(),
        read: n.read,
      });
    });

    // Sort: newest first
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setNotifications(items);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowPanel(false);
    }
    if (showPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  function handleMarkAllRead() {
    markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleMarkRead(id: string) {
    if (id.startsWith('fr_')) return; // Friend requests handled elsewhere
    markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  // Icon for notification type
  function getIcon(type: string) {
    switch(type) {
      case 'learning_complete': return '📖';
      case 'quiz_complete': return '📝';
      case 'streak_milestone': return '🔥';
      case 'vocab_milestone': return '📚';
      case 'friend_request': return '👥';
      default: return '📌';
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setShowPanel(!showPanel)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
            <h3 className="font-bold text-gray-900">通知</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-[var(--primary)] hover:underline">全部已读</button>
              )}
              <button onClick={() => setShowPanel(false)}><X size={16} className="text-gray-400" /></button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无通知</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n: any) => (
                <div key={n.id} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`} onClick={() => handleMarkRead(n.id)}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{getIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-2" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
