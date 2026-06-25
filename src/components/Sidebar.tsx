import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Star, Layers, HelpCircle, Puzzle,
  Keyboard, Settings, Flame, LogOut, Shield, User, TrendingUp,
} from 'lucide-react';
import type { UserProfile } from '@/types/vocabulary';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps { profile: UserProfile; currentStreak: number; }

function SideNavLink({ to, icon: Icon, label, end = false, accent = false }: {
  to: string; icon: React.ElementType; label: string; end?: boolean; accent?: boolean;
}) {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(to + '/');
  return (
    <NavLink to={to} end={end}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
      }`}
    >
      {isActive && <div className="absolute left-0 h-4 w-[3px] rounded-r-full bg-[#F5A623]" />}
      <Icon className={`h-5 w-5 flex-shrink-0 ${accent ? 'text-[#F5A623]' : ''}`} strokeWidth={1.5} />
      <span className={accent ? 'text-[#F5A623]' : ''}>{label}</span>
    </NavLink>
  );
}

export function Sidebar({ profile, currentStreak }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  return (
    <aside className="flex h-full w-[210px] flex-col bg-[#1A1A2E] text-white">
      {/* Logo */}
      <div className="flex items-center gap-1 px-5 py-5">
        <span className="text-lg font-bold tracking-tight leading-tight">Master of English</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] self-start mt-1 flex-shrink-0" />
      </div>

      <nav className="flex-1 px-3 overflow-y-auto space-y-5">
        {/* Library */}
        <div>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Library</div>
          <div className="space-y-0.5">
            <SideNavLink to="/"          icon={LayoutDashboard} label="Dashboard" end />
            <SideNavLink to="/words"     icon={BookOpen}        label="My Words" />
            <SideNavLink to="/favorites" icon={Star}            label="Favorites" />
          </div>
        </div>

        {/* Study */}
        <div>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Study</div>
          <div className="space-y-0.5">
            <SideNavLink to="/study/level"      icon={TrendingUp}  label="Level Journey" accent />
            <SideNavLink to="/study/flashcards" icon={Layers}      label="Flashcards" />
            <SideNavLink to="/study/quiz"       icon={HelpCircle}  label="Quiz" />
            <SideNavLink to="/study/matching"   icon={Puzzle}      label="Matching" />
            <SideNavLink to="/study/spelling"   icon={Keyboard}    label="Spelling" />
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Account</div>
          <div className="space-y-0.5">
            <SideNavLink to="/settings"   icon={Settings} label="Settings" />
            <SideNavLink to="/my-account" icon={User}     label="My Account" />
            {currentUser?.role === 'admin' && (
              <SideNavLink to="/admin" icon={Shield} label="Admin Panel" accent />
            )}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-3 py-3">
        <NavLink to="/my-account"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
          }
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 ${
            currentUser?.role === 'admin' ? 'bg-[#F5A623]' : 'bg-[#4A90E2]'
          }`}>
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile.username}</div>
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <Flame className="h-3 w-3 text-[#F5A623]" />
              <span>{currentStreak}d streak</span>
            </div>
          </div>
        </NavLink>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut className="h-4 w-4" /><span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
