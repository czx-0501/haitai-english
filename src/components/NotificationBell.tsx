import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../supabase/client';
import { getCurrentUser } from '../supabase/auth';

export default function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const user = await getCurrentUser();
      if (!user?.id) return;
      const { data: requests } = await supabase
        .from('friend_requests')
        .select('*, from_user:from_user_id (nickname)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      const items: any[] = [];
      if (requests && requests.length > 0) {
        requests.forEach((r: any) => {
          items.push({ id: r.id, type: 'friend_request', message: `${r.from_user?.nickname || '某人'} 请求添加好友`, time: r.created_at });
        });
      }
      setNotifications(items);
    } catch(e) {}
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowPanel(false);
    }
    if (showPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setShowPanel(!showPanel)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell size={20} className="text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">通知</h3>
            <button onClick={() => setShowPanel(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">暂无新通知</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n: any) => (
                <div key={n.id} className="p-4 hover:bg-gray-50">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.time).toLocaleDateString('zh-CN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
