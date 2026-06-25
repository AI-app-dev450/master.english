import { Routes, Route } from 'react-router-dom';
import { createContext, useContext, useCallback, useEffect } from 'react';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useToast } from '@/hooks/useToast';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import { useGoogleSheet } from '@/hooks/useGoogleSheet';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { ToastContainer } from '@/components/ToastContainer';
import { Dashboard } from '@/pages/Dashboard';
import { WordList } from '@/pages/WordList';
import { Favorites } from '@/pages/Favorites';
import { LevelJourney } from '@/pages/LevelJourney';
import { StudyLayout } from '@/pages/StudyLayout';
import { Flashcards } from '@/pages/Flashcards';
import { Quiz } from '@/pages/Quiz';
import { Matching } from '@/pages/Matching';
import { Spelling } from '@/pages/Spelling';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { AuthPage } from '@/pages/AuthPage';
import { AdminPanel } from '@/pages/AdminPanel';
import { UserDashboard } from '@/pages/UserDashboard';

interface AppContextType {
  vocabulary: ReturnType<typeof useVocabulary>;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => string;
  gsheet: ReturnType<typeof useGoogleSheet>;
}

export const AppContext = createContext<AppContextType | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function AppInner() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const vocabulary = useVocabulary(currentUser?.dataKey);
  const { toasts, addToast, removeToast } = useToast();
  const gsheet = useGoogleSheet();

  // On login: merge shared Google Sheet words so every user sees the latest
  const mergeShared = useCallback(() => {
    const shared = gsheet.getSharedWords();
    if (shared.length > 0) vocabulary.mergeSharedWords(shared);
  }, [gsheet, vocabulary]);

  useEffect(() => {
    if (isAuthenticated) mergeShared();
  }, [isAuthenticated]);

  // Auto-sync listener (triggered by the interval in useGoogleSheet)
  useEffect(() => {
    const handler = () => {
      gsheet.syncNow(vocabulary.mergeSharedWords);
    };
    window.addEventListener('moe-gsheet-autosync', handler);
    return () => window.removeEventListener('moe-gsheet-autosync', handler);
  }, [gsheet, vocabulary]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-[3px] border-[#1A1A2E]/20 border-t-[#1A1A2E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthPage />;

  return (
    <AppContext.Provider value={{ vocabulary, addToast, gsheet }}>
      <div className="flex h-screen w-screen overflow-hidden bg-background dot-grid-bg">
        <div className="sidebar-desktop hidden md:block">
          <Sidebar profile={vocabulary.profile} currentStreak={vocabulary.profile.currentStreak} />
        </div>
        <main className="flex-1 overflow-y-auto main-content">
          <div className="mx-auto max-w-[960px] px-4 py-6 md:px-8 md:py-8 main-content-mobile-pad md:pb-8">
            <Routes>
              <Route path="/"              element={<Dashboard />} />
              <Route path="/words"         element={<WordList />} />
              <Route path="/favorites"     element={<Favorites />} />
              <Route path="/study"         element={<StudyLayout />}>
                <Route path="level"        element={<LevelJourney />} />
                <Route path="flashcards"   element={<Flashcards />} />
                <Route path="quiz"         element={<Quiz />} />
                <Route path="matching"     element={<Matching />} />
                <Route path="spelling"     element={<Spelling />} />
              </Route>
              <Route path="/settings"      element={<Settings />} />
              <Route path="/profile"       element={<Profile />} />
              <Route path="/my-account"    element={<UserDashboard />} />
              {currentUser?.role === 'admin' && (
                <Route path="/admin" element={<AdminPanel />} />
              )}
            </Routes>
          </div>
        </main>
        <MobileNav />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
