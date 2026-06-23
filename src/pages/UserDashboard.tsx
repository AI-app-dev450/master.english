import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Flame, BookOpen, Target, TrendingUp, Calendar,
  Save, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/App';
import type { CEFRLevel } from '@/types/vocabulary';

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function UserDashboard() {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const { vocabulary, addToast } = useApp();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>((currentUser?.cefrLevel as CEFRLevel) || 'A2');
  const [dailyGoal, setDailyGoal] = useState(currentUser?.dailyGoal || 10);

  const stats = vocabulary.getStats();

  const handleSaveProfile = () => {
    updateCurrentUserProfile({ username, cefrLevel, dailyGoal });
    vocabulary.updateProfile({ username, cefrLevel, dailyGoal });
    addToast('Profile updated', 'success');
    setEditing(false);
  };

  const progressPercent = stats.totalWords > 0
    ? Math.round((stats.learnedWords / stats.totalWords) * 100)
    : 0;

  const todaySessions = vocabulary.sessions.filter(s =>
    new Date(s.date).toDateString() === new Date().toDateString()
  );
  const todayWords = todaySessions.reduce((acc, s) => acc + s.wordsStudied, 0);
  const goalProgress = Math.min(100, (todayWords / (currentUser?.dailyGoal || 10)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white bg-[#4A90E2]">
          {currentUser?.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {currentUser?.username}!
          </h1>
          <p className="text-sm text-gray-500">
            {currentUser?.cefrLevel} learner · Joined {new Date(currentUser?.joinDate || '').toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Today's Progress Banner */}
      <div className="bg-[#1A1A2E] rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/70">Daily Goal Progress</span>
          <span className="text-sm font-medium">{todayWords} / {currentUser?.dailyGoal || 10} words</span>
        </div>
        <div className="h-2 bg-card/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-[#F5A623] rounded-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-white/50 flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-[#F5A623]" /> streak
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.learnedWords}</div>
            <div className="text-xs text-white/50">mastered</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">{stats.totalWords}</div>
            <div className="text-xs text-white/50">total words</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Words Learned', value: `${stats.learnedWords}/${stats.totalWords}`, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Study Sessions', value: stats.totalSessions, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Mastery', value: `${progressPercent}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Daily Goal', value: `${currentUser?.dailyGoal} words`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(card => (
          <motion.div
            key={card.label}
            whileHover={{ y: -2 }}
            className="bg-card rounded-xl border border-gray-100 p-4"
          >
            <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{card.value}</div>
            <div className="text-xs text-gray-500">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Edit Profile */}
      <div className="bg-card rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="h-4 w-4" /> Profile Settings
          </h3>
          <button
            onClick={() => editing ? handleSaveProfile() : setEditing(true)}
            className="flex items-center gap-1.5 text-sm text-[#4A90E2] hover:text-blue-700 font-medium"
          >
            {editing
              ? <><CheckCircle2 className="h-4 w-4" /> Save</>
              : <><Save className="h-4 w-4" /> Edit</>
            }
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CEFR Level</label>
              <div className="flex gap-1.5 flex-wrap">
                {CEFR_LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setCefrLevel(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      cefrLevel === l
                        ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                        : 'bg-card text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Daily Goal (words)</label>
              <input
                type="number"
                value={dailyGoal}
                onChange={e => setDailyGoal(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-foreground">{currentUser?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-foreground">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Level</span>
              <span className="font-medium text-foreground">{currentUser?.cefrLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Daily Goal</span>
              <span className="font-medium text-foreground">{currentUser?.dailyGoal} words/day</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="font-medium capitalize text-[#4A90E2]">{currentUser?.role}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
