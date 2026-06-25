import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, ArrowLeft, ArrowRight, Star, Bookmark,
  Tag, BarChart2, RefreshCw,
} from 'lucide-react';
import { useApp } from '@/App';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyWord, CEFRLevel } from '@/types/vocabulary';

// ── Reuse the same visual tokens as WordCard ───────────────────────────────────
const POS_COLORS: Record<string, string> = {
  noun:         'bg-blue-50   text-blue-700',
  verb:         'bg-green-50  text-green-700',
  adjective:    'bg-purple-50 text-purple-700',
  adverb:       'bg-orange-50 text-orange-700',
  pronoun:      'bg-pink-50   text-pink-700',
  preposition:  'bg-gray-50   text-gray-700',
  conjunction:  'bg-teal-50   text-teal-700',
  interjection: 'bg-red-50    text-red-700',
  phrase:       'bg-indigo-50 text-indigo-700',
};

const CEFR_STYLE: Record<string, { bg: string; label: string }> = {
  A1: { bg: 'bg-emerald-100 text-emerald-700', label: 'A1 · Beginner'     },
  A2: { bg: 'bg-green-100   text-green-700',   label: 'A2 · Elementary'   },
  B1: { bg: 'bg-yellow-100  text-yellow-700',  label: 'B1 · Intermediate' },
  B2: { bg: 'bg-orange-100  text-orange-700',  label: 'B2 · Upper-Int.'   },
  C1: { bg: 'bg-red-100     text-red-700',     label: 'C1 · Advanced'     },
  C2: { bg: 'bg-purple-100  text-purple-700',  label: 'C2 · Mastery'      },
};

const DIFF_STYLE: Record<string, { color: string; dots: number; label: string }> = {
  easy:   { color: 'text-emerald-600', dots: 1, label: 'Easy'   },
  medium: { color: 'text-amber-500',   dots: 2, label: 'Medium' },
  hard:   { color: 'text-red-500',     dots: 3, label: 'Hard'   },
};

function DifficultyDots({ level }: { level: string }) {
  const s = DIFF_STYLE[level] ?? DIFF_STYLE.medium;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${s.color}`}>
      {[1, 2, 3].map(n => (
        <span key={n} className={`inline-block h-1.5 w-1.5 rounded-full ${n <= s.dots ? 'bg-current' : 'bg-current opacity-20'}`} />
      ))}
      <span className="ml-1">{s.label}</span>
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function Flashcards() {
  const { vocabulary, addToast } = useApp();
  const { speak } = useSpeech();

  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'all'>('all');
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [isFlipped, setIsFlipped]         = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats]   = useState({ mastered: 0, review: 0 });
  const [shuffledWords, setShuffledWords] = useState<VocabularyWord[]>([]);
  const [showSetup, setShowSetup]         = useState(true);
  const [direction, setDirection]         = useState<'left' | 'right' | null>(null);

  // Level-journey & favorites session filter (set by LevelJourney / Favorites page)
  const _ssFilter = sessionStorage.getItem('moe_study_filter');
  const _ssLevel  = sessionStorage.getItem('moe_study_level') as CEFRLevel | null;
  const levelWords = _ssFilter === 'favorites'
    ? vocabulary.words.filter(w => w.isStarred)
    : _ssFilter === 'level' && _ssLevel
    ? vocabulary.words.filter(w => w.cefrLevel === _ssLevel)
    : selectedLevel === 'all'
    ? vocabulary.words
    : vocabulary.words.filter(w => w.cefrLevel === selectedLevel);

  const startSession = () => {
    const filtered = levelWords.filter(w => !w.isLearned);
    if (filtered.length === 0) { addToast('No words to study! All words are learned.', 'info'); return; }
    const list = vocabulary.settings.shuffleCards
      ? [...filtered].sort(() => Math.random() - 0.5)
      : [...filtered];
    setShuffledWords(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSessionStats({ mastered: 0, review: 0 });
    setDirection(null);
    setShowSetup(false);
  };

  const handleFlip = useCallback(() => setIsFlipped(p => !p), []);

  const handleNext = useCallback((learned: boolean) => {
    const word = shuffledWords[currentIndex];
    setDirection(learned ? 'right' : 'left');

    if (learned) {
      vocabulary.updateWord(word.id, {
        isLearned: true,
        studyCount: word.studyCount + 1,
        correctCount: word.correctCount + 1,
        lastStudied: new Date().toISOString(),
      });
      setSessionStats(p => ({ ...p, mastered: p.mastered + 1 }));
    } else {
      vocabulary.updateWord(word.id, {
        studyCount: word.studyCount + 1,
        lastStudied: new Date().toISOString(),
      });
      setSessionStats(p => ({ ...p, review: p.review + 1 }));
    }

    if (currentIndex < shuffledWords.length - 1) {
      setIsFlipped(false);
      setTimeout(() => { setCurrentIndex(p => p + 1); setDirection(null); }, 220);
    } else {
      setSessionComplete(true);
    }
  }, [shuffledWords, currentIndex, vocabulary]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showSetup || sessionComplete) return;
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); handleFlip(); }
      else if (e.code === 'ArrowLeft')  handleNext(false);
      else if (e.code === 'ArrowRight') handleNext(true);
      else if (e.code === 'KeyS') {
        const w = shuffledWords[currentIndex];
        if (w) vocabulary.toggleStar(w.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSetup, sessionComplete, handleFlip, handleNext, shuffledWords, currentIndex, vocabulary]);

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3DD]">
              <Bookmark className="h-8 w-8 text-[#F5A623]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Flashcards</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {levelWords.filter(w => !w.isLearned).length} words ready to study
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Select Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(level => (
                <button key={level} onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    selectedLevel === level
                      ? 'bg-[#F5A623] text-white shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted/50'
                  }`}>
                  {level === 'all' ? 'All' : level}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startSession}
            className="w-full rounded-[10px] bg-[#F5A623] py-3 text-sm font-semibold text-white hover:bg-[#E09400] transition-colors">
            Start Session
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Complete screen ───────────────────────────────────────────────────────────
  if (sessionComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16">
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="text-5xl">🎉</div>
          <h2 className="text-3xl font-bold text-foreground">Session Complete!</h2>
          <div className="flex justify-center gap-10">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#34C759]">{sessionStats.mastered}</div>
              <div className="text-sm text-muted-foreground mt-1">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#F5A623]">{sessionStats.review}</div>
              <div className="text-sm text-muted-foreground mt-1">Need Review</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowSetup(true)}
              className="rounded-[10px] border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
              New Session
            </button>
            <button onClick={startSession}
              className="flex items-center gap-2 rounded-[10px] bg-[#F5A623] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#E09400] transition-colors">
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} /> Study Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Study screen ──────────────────────────────────────────────────────────────
  const word = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;
  const cefrStyle = CEFR_STYLE[word.cefrLevel] ?? { bg: 'bg-gray-100 text-gray-600', label: word.cefrLevel };

  return (
    <div className="space-y-5">

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Card {currentIndex + 1} of {shuffledWords.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <motion.div className="h-full rounded-full bg-[#F5A623]"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${word.id}-${isFlipped ? 'back' : 'front'}`}
          initial={{ opacity: 0, x: direction === 'right' ? 40 : direction === 'left' ? -40 : 0, rotateY: isFlipped ? -8 : 8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="w-full cursor-pointer"
          onClick={handleFlip}
        >
          {!isFlipped ? (
            /* ── FRONT ── */
            <div className="rounded-2xl border border-border bg-card shadow-sm min-h-[220px] flex flex-col items-center justify-center p-8 relative">
              {/* Star top-right */}
              <button
                onClick={e => { e.stopPropagation(); vocabulary.toggleStar(word.id); }}
                className="absolute top-4 right-4 rounded-lg p-1.5 transition-colors hover:bg-muted/50"
                title="Star this word (S)"
              >
                <Star className={`h-5 w-5 ${word.isStarred ? 'fill-[#F5A623] text-[#F5A623]' : 'text-muted-foreground'}`} strokeWidth={1.5} />
              </button>

              <h3 className="text-4xl font-bold text-foreground text-center mb-4">{word.word}</h3>

              {/* POS badge */}
              <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${POS_COLORS[word.partOfSpeech] ?? 'bg-gray-50 text-gray-700'}`}>
                {word.partOfSpeech}
              </span>

              {/* CEFR + difficulty row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap justify-center">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cefrStyle.bg}`}>
                  {cefrStyle.label}
                </span>
                {word.difficulty && <DifficultyDots level={word.difficulty} />}
                {word.category && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" />{word.category}
                  </span>
                )}
              </div>

              {vocabulary.settings.showHints && (
                <p className="absolute bottom-4 text-xs text-muted-foreground/60">Tap to reveal · S to star</p>
              )}
            </div>
          ) : (
            /* ── BACK ── */
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-3">

              {/* Word + audio + star */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-foreground">{word.word}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${POS_COLORS[word.partOfSpeech] ?? 'bg-gray-50 text-gray-700'}`}>
                    {word.partOfSpeech}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={e => { e.stopPropagation(); speak(word.word); }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors" title="Pronounce">
                    <Volume2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); vocabulary.toggleStar(word.id); }}
                    className="rounded-lg p-1.5 transition-colors hover:bg-muted/50" title="Star (S)">
                    <Star className={`h-4 w-4 ${word.isStarred ? 'fill-[#F5A623] text-[#F5A623]' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cefrStyle.bg}`}>
                  {cefrStyle.label}
                </span>
                {word.difficulty && <DifficultyDots level={word.difficulty} />}
                {word.category && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" />{word.category}
                  </span>
                )}
                {word.isLearned && (
                  <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">✓ Learned</span>
                )}
              </div>

              {/* Definition */}
              <p className="text-sm font-medium text-foreground leading-relaxed">{word.definition}</p>

              {/* Translations */}
              {vocabulary.settings.showTranslations && (word.laoTranslation || word.thaiTranslation) && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {word.laoTranslation  && <span>🇱🇦 {word.laoTranslation}</span>}
                  {word.thaiTranslation && <span>🇹🇭 {word.thaiTranslation}</span>}
                </div>
              )}

              {/* Example */}
              {word.exampleSentence && (
                <p className="text-[13px] italic text-muted-foreground leading-relaxed">
                  &ldquo;{word.exampleSentence}&rdquo;
                </p>
              )}

              {/* Synonyms / Antonyms */}
              {(word.synonym || word.antonym) && (
                <div className="flex flex-wrap gap-2">
                  {word.synonym && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">Syn:</span>
                      {word.synonym.split(',').map((s, i) => (
                        <span key={i} className="rounded-full bg-[#FFF3DD] px-2 py-0.5 text-[11px] font-medium text-[#B37600]">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                  {word.antonym && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">Ant:</span>
                      {word.antonym.split(',').map((a, i) => (
                        <span key={i} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">{a.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Study progress */}
              {word.studyCount > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BarChart2 className="h-3 w-3" /> Progress
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {word.correctCount}/{word.studyCount} correct
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#34C759] transition-all"
                      style={{ width: `${Math.round((word.correctCount / word.studyCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button onClick={() => handleNext(false)}
          className="flex items-center gap-2 rounded-xl border-2 border-[#F5A623] bg-card px-6 py-3 text-sm font-semibold text-[#F5A623] hover:bg-[#FFF3DD] transition-colors">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Still Learning
        </button>
        <button onClick={() => handleNext(true)}
          className="flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E09400] transition-colors">
          Got It <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground/70">
        Space to flip · ← Still Learning · → Got It · S to star
      </p>
    </div>
  );
}
