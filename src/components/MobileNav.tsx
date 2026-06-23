import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, GraduationCap, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const mobileNavItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard, exact: true },
    { path: '/words', label: 'Words', icon: BookOpen, exact: false },
    { path: '/study/flashcards', label: 'Study', icon: GraduationCap, exact: false, matchPrefix: '/study' },
    { path: '/settings', label: 'Settings', icon: Settings, exact: false },
    currentUser?.role === 'admin'
      ? { path: '/admin', label: 'Admin', icon: Shield, exact: false }
      : { path: '/my-account', label: 'Account', icon: User, exact: false },
  ];

  return (
    <nav className="sidebar-mobile fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E5DD] bg-[#1A1A2E] mobile-nav-safe">
      <div className="flex items-center justify-around px-2 pt-1">
        {mobileNavItems.map((item) => {
          const matchPath = item.matchPrefix || item.path;
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(matchPath);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#F5A623]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
