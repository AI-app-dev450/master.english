import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, Upload, Download, Trash2, ToggleLeft, ToggleRight,
  Github, RefreshCw, Settings2, AlertTriangle, CheckCircle2, Cloud,
  WifiOff, Database, FileDown, FileUp, Crown, UserX, UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/App';
import type { AuthUser } from '@/types/auth';
import Papa from 'papaparse';

export function AdminPanel() {
  const { getAllUsers, updateUser, deleteUser, toggleUserActive, getGithubConfig, saveGithubConfig, syncToGithub, loadFromGithub, isOnline, currentUser } = useAuth();
  const { vocabulary, addToast } = useApp();
  const [section, setSection] = useState<'users' | 'sync' | 'data'>('users');
  const [users, setUsers] = useState<AuthUser[]>(() => getAllUsers());
  const [ghToken, setGhToken] = useState(() => getGithubConfig()?.token || '');
  const [ghRepo, setGhRepo] = useState(() => getGithubConfig()?.repo || '');
  const [ghBranch, setGhBranch] = useState(() => getGithubConfig()?.branch || 'main');
  const [syncing, setSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refreshUsers = useCallback(() => setUsers(getAllUsers()), [getAllUsers]);

  const handleToggleActive = (id: string) => {
    toggleUserActive(id);
    refreshUsers();
    addToast('User status updated', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteUser(id);
      setConfirmDelete(null);
      refreshUsers();
      addToast('User deleted', 'info');
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleSaveGithub = () => {
    saveGithubConfig({ token: ghToken, repo: ghRepo, branch: ghBranch });
    addToast('GitHub config saved', 'success');
  };

  const handleSyncAll = async () => {
    if (!isOnline) { addToast('No internet connection', 'error'); return; }
    setSyncing(true);
    const data = {
      words: vocabulary.words,
      sessions: vocabulary.sessions,
      profile: vocabulary.profile,
      settings: vocabulary.settings,
      syncedAt: new Date().toISOString(),
    };
    const res = await syncToGithub(data, currentUser!.id);
    addToast(res.message, res.success ? 'success' : 'error');
    setSyncing(false);
  };

  const handleExportAllUsers = () => {
    const allData = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      joinDate: u.joinDate,
      lastLogin: u.lastLogin || '',
      isActive: u.isActive,
      cefrLevel: u.cefrLevel,
      currentStreak: u.currentStreak,
    }));
    const csv = Papa.unparse(allData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexicon_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('Users exported', 'success');
  };

  const handleExportVocabulary = () => {
    const csv = Papa.unparse(vocabulary.words.map(w => ({
      word: w.word,
      partOfSpeech: w.partOfSpeech,
      definition: w.definition,
      exampleSentence: w.exampleSentence,
      synonym: w.synonym || '',
      antonym: w.antonym || '',
      cefrLevel: w.cefrLevel,
      category: w.category || '',
      difficulty: w.difficulty,
      isLearned: w.isLearned,
      studyCount: w.studyCount,
      correctCount: w.correctCount,
      laoTranslation: w.laoTranslation || '',
      thaiTranslation: w.thaiTranslation || '',
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexicon_vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('Vocabulary exported', 'success');
  };

  const handleImportVocabulary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const imported = rows.filter(r => r.word).map(r => ({
          word: r.word || '',
          partOfSpeech: (r.partOfSpeech as any) || 'noun',
          definition: r.definition || '',
          exampleSentence: r.exampleSentence || '',
          synonym: r.synonym,
          antonym: r.antonym,
          cefrLevel: (r.cefrLevel as any) || 'B1',
          category: r.category,
          difficulty: (r.difficulty as any) || 'medium',
          laoTranslation: r.laoTranslation,
          thaiTranslation: r.thaiTranslation,
        }));
        vocabulary.importWords(imported as any);
        addToast(`Imported ${imported.length} words`, 'success');
      },
      error: () => addToast('Failed to parse CSV', 'error'),
    });
    e.target.value = '';
  };

  const handleLoadFromGithub = async () => {
    if (!isOnline) { addToast('No internet connection', 'error'); return; }
    setSyncing(true);
    const res = await loadFromGithub(currentUser!.id);
    if (res.success && res.data) {
      const d = res.data as any;
      if (d.words) vocabulary.importWords(d.words);
      addToast('Loaded data from GitHub', 'success');
    } else {
      addToast(res.message, 'error');
    }
    setSyncing(false);
  };

  const sectionTabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'sync', label: 'GitHub Sync', icon: Github },
    { id: 'data', label: 'Import/Export', icon: Database },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center">
          <Shield className="h-5 w-5 text-[#F5A623]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1A1A2E]">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage users, sync, and vocabulary data</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Cloud className="h-3 w-3" /> Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {sectionTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              section === t.id ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Users Section */}
      {section === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1A2E]">All Users ({users.length})</h2>
            <button onClick={handleExportAllUsers} className="flex items-center gap-1.5 text-sm text-[#4A90E2] hover:text-blue-700">
              <FileDown className="h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    user.role === 'admin' ? 'bg-[#F5A623]' : 'bg-[#4A90E2]'
                  }`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1A1A2E] text-sm">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                          <Crown className="h-2.5 w-2.5" /> Admin
                        </span>
                      )}
                      {!user.isActive && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(user.joinDate).toLocaleDateString()} · {user.cefrLevel} · {user.currentStreak} day streak
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      disabled={user.role === 'admin'}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        user.role === 'admin' ? 'opacity-30 cursor-not-allowed' :
                        user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {user.isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={user.role === 'admin' || user.id === currentUser?.id}
                      title={confirmDelete === user.id ? 'Click again to confirm' : 'Delete user'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        confirmDelete === user.id ? 'bg-red-100 text-red-600' :
                        user.role === 'admin' || user.id === currentUser?.id
                          ? 'opacity-30 cursor-not-allowed text-gray-400'
                          : 'text-red-400 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* GitHub Sync Section */}
      {section === 'sync' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-[#1A1A2E]" />
              <h2 className="font-semibold text-[#1A1A2E]">GitHub Storage Configuration</h2>
            </div>
            <p className="text-sm text-gray-500">Store vocabulary data in a GitHub repository. Works online; falls back to local storage when offline.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token</label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={e => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
                <p className="text-xs text-gray-400 mt-1">Needs repo write access. Create at GitHub → Settings → Developer settings.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository (owner/repo)</label>
                <input
                  type="text"
                  value={ghRepo}
                  onChange={e => setGhRepo(e.target.value)}
                  placeholder="username/lexicon-data"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={ghBranch}
                  onChange={e => setGhBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
                />
              </div>
            </div>

            <button
              onClick={handleSaveGithub}
              className="w-full py-2.5 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium hover:bg-[#252540] transition-colors flex items-center justify-center gap-2"
            >
              <Settings2 className="h-4 w-4" /> Save Configuration
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-[#1A1A2E]">Sync Actions</h3>
            <div className="flex gap-3">
              <button
                onClick={handleSyncAll}
                disabled={syncing || !isOnline}
                className="flex-1 py-2.5 bg-[#34C759] text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {syncing ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                Push to GitHub
              </button>
              <button
                onClick={handleLoadFromGithub}
                disabled={syncing || !isOnline}
                className="flex-1 py-2.5 bg-[#4A90E2] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {syncing ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
                Pull from GitHub
              </button>
            </div>
            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <WifiOff className="h-4 w-4" />
                Offline — changes saved locally and will sync when reconnected
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Import/Export Section */}
      {section === 'data' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-[#1A1A2E]">Vocabulary Data</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportVocabulary}
                className="py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium hover:bg-[#252540] transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="h-4 w-4" /> Export Words CSV
              </button>
              <label className="py-3 bg-[#4A90E2] text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <FileUp className="h-4 w-4" /> Import Words CSV
                <input type="file" accept=".csv" onChange={handleImportVocabulary} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <p className="font-medium mb-1">CSV columns for import:</p>
              <p className="font-mono text-[10px] text-gray-400">word, partOfSpeech, definition, exampleSentence, synonym, antonym, cefrLevel, category, difficulty, laoTranslation, thaiTranslation</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-[#1A1A2E]">User Data</h2>
            <button
              onClick={handleExportAllUsers}
              className="w-full py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-medium hover:bg-[#252540] transition-colors flex items-center justify-center gap-2"
            >
              <FileDown className="h-4 w-4" /> Export All Users CSV
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Admin Only</p>
                <p className="text-xs text-amber-700 mt-1">These actions affect all vocabulary data in the system. Exports contain all words across the app. Import merges new words with existing ones.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
