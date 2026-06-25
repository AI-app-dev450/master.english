import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Star, TrendingUp, BookOpen, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav() {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();

  const items = [
    { to: '/',              label: 'Home',     icon: LayoutDashboard, exact: true,  prefix: '/'          },
    { to: '/words',         label: 'Words',    icon: BookOpen,        exact: false, prefix: '/words'      },
    { to: '/favorites',     label: 'Favorites',icon: Star,            exact: false, prefix: '/favorites'  },
    { to: '/study/level',   label: 'Journey',  icon: TrendingUp,      exact: false, prefix: '/study'      },
    currentUser?.role === 'admin'
      ? { to: '/admin',      label: 'Admin',   icon: Shield, exact: false, prefix: '/admin' }
      : { to: '/my-account', label: 'Account', icon: User,   exact: false, prefix: '/my-account' },
  ];

  return (
    <nav className="sidebar-mobile fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1A1A2E] mobile-nav-safe">
      <div className="flex items-center justify-around px-1 py-1">
        {items.map(item => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.prefix);
          return (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                active ? 'text-[#F5A623] bg-white/5' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'text-[#F5A623]' : ''}`} strokeWidth={active ? 2 : 1.5} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
