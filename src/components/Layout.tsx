import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Users } from 'lucide-react';
import { initNativeFeatures } from '../utils/native';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/learn', icon: BookOpen, label: '学习' },
  { to: '/circle', icon: Users, label: '圈子' },
  { to: '/stats', icon: BarChart3, label: '统计' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
 useEffect(() => {
   initNativeFeatures();
    // Force WKWebView viewport recalculation on initial render
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
 }, []);

  return (
    <div className="flex flex-col min-h-dvh">
     <main className="flex-1 pb-28 max-w-2xl mx-auto w-full px-4 pt-4 safe-area-top">
        <div className="flex justify-end mb-2">
          <NotificationBell />
        </div>
       {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-[var(--primary)]' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-base font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
