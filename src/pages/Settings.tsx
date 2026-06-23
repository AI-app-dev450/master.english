import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Globe, Sun, Volume2, Shuffle, Lightbulb,
  Trash2, Save, AlertTriangle,
} from 'lucide-react';
import { useApp } from '@/App';
import type { CEFRLevel } from '@/types/vocabulary';

export function Settings() {
  const { vocabulary, addToast } = useApp();
  const [activeSection, setActiveSection] = useState<'account' | 'study' | 'display' | 'data'>('account');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Account form state
  const [username, setUsername] = useState(vocabulary.profile.username);
  const [email, setEmail] = useState(vocabulary.profile.email);
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>(vocabulary.profile.cefrLevel);
  const [dailyGoal, setDailyGoal] = useState(vocabulary.profile.dailyGoal);

  const handleSaveProfile = () => {
    vocabulary.updateProfile({ username, email, cefrLevel, dailyGoal });
    addToast('Profile saved successfully', 'success');
  };

  const handleResetProgress = () => {
    vocabulary.resetProgress();
    setShowResetConfirm(false);
    addToast('All progress has been reset', 'success');
  };

  const sections = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'study' as const, label: 'Study', icon: Lightbulb },
    { id: 'display' as const, label: 'Display', icon: Sun },
    { id: 'data' as const, label: 'Data', icon: Trash2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your learning preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Sidebar nav */}
        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-card border border-border text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card/60'
              }`}
            >
              <section.icon className="h-4 w-4" strokeWidth={1.5} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content panels */}
        <div className="space-y-4">

          {/* ── Account ── */}
          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-[10px] border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[10px] border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">CEFR Level</label>
                  <div className="flex gap-2">
                    {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setCefrLevel(level)}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                          cefrLevel === level
                            ? 'bg-[#F5A623] text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                    Daily Goal: <span className="text-[#F5A623] font-bold">{dailyGoal} words</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full accent-[#F5A623]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span><span>50</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 rounded-[10px] bg-[#F5A623] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#E09400] transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" strokeWidth={1.5} />
                Save Changes
              </button>
            </motion.div>
          )}

          {/* ── Study ── */}
          {activeSection === 'study' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-foreground">Study Preferences</h2>

              <div className="space-y-4">
                <ToggleSetting
                  label="Show Translations"
                  description="Display Lao and Thai translations"
                  icon={Globe}
                  enabled={vocabulary.settings.showTranslations}
                  onChange={(val) => vocabulary.updateSettings({ showTranslations: val })}
                />
                <ToggleSetting
                  label="Auto-play Pronunciation"
                  description="Automatically play audio for words"
                  icon={Volume2}
                  enabled={vocabulary.settings.autoPlayPronunciation}
                  onChange={(val) => vocabulary.updateSettings({ autoPlayPronunciation: val })}
                />
                <ToggleSetting
                  label="Shuffle Cards"
                  description="Randomize card order in flashcard mode"
                  icon={Shuffle}
                  enabled={vocabulary.settings.shuffleCards}
                  onChange={(val) => vocabulary.updateSettings({ shuffleCards: val })}
                />
                <ToggleSetting
                  label="Show Hints"
                  description="Display hint text during study"
                  icon={Lightbulb}
                  enabled={vocabulary.settings.showHints}
                  onChange={(val) => vocabulary.updateSettings({ showHints: val })}
                />
              </div>
            </motion.div>
          )}

          {/* ── Display ── */}
          {activeSection === 'display' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border bg-card p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-foreground">Display Settings</h2>

              <div className="space-y-5">
                {/* Theme */}
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-foreground">Theme</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'light' as const, label: '☀️ Light' },
                      { value: 'dark' as const, label: '🌙 Dark' },
                      { value: 'system' as const, label: '⚙️ System' },
                    ]).map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => vocabulary.updateSettings({ theme: theme.value })}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                          vocabulary.settings.theme === theme.value
                            ? 'bg-[#F5A623] text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Theme changes apply to the whole app immediately.
                  </p>
                </div>

                {/* Font Size */}
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-foreground">Font Size</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'small' as const, label: 'Small' },
                      { value: 'medium' as const, label: 'Medium' },
                      { value: 'large' as const, label: 'Large' },
                    ]).map((size) => (
                      <button
                        key={size.value}
                        onClick={() => vocabulary.updateSettings({ fontSize: size.value })}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                          vocabulary.settings.fontSize === size.value
                            ? 'bg-[#F5A623] text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <p className={`font-medium text-foreground ${
                    vocabulary.settings.fontSize === 'small' ? 'text-sm' :
                    vocabulary.settings.fontSize === 'large' ? 'text-xl' : 'text-base'
                  }`}>
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Data (Reset only — no sync for users) ── */}
          {activeSection === 'data' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
                <p className="text-sm text-muted-foreground">
                  Your data is stored locally on this device. Resetting progress will clear
                  study history and streaks but keep your word list intact.
                </p>

                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-[#FF3B30] mt-0.5" strokeWidth={1.5} />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Reset Study Progress</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will clear all study counts, streaks, and session history. Your word list will not be affected.
                      </p>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        className="mt-3 flex items-center gap-2 rounded-lg border border-[#FF3B30] bg-white px-4 py-2 text-sm font-medium text-[#FF3B30] hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        Reset Progress
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-[#FF3B30]" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Reset All Progress?</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                This will reset study counts, streaks, and session history. Your words will not be deleted.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 rounded-[10px] border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProgress}
                  className="flex-1 rounded-[10px] bg-[#FF3B30] py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function ToggleSetting({
  label, description, icon: Icon, enabled, onChange,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-[#F5A623]' : 'bg-[#E5E5DD]'}`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
