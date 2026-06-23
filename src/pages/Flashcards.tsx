import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, ArrowLeft, ArrowRight, Star, Bookmark } from 'lucide-react';
import { useApp } from '@/App';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyWord, CEFRLevel } from '@/types/vocabulary';

export function Flashcards() {
  const { vocabulary, addToast } = useApp();
  const { speak } = useSpeech();
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ mastered: 0, review: 0 });
  const [shuffledWords, setShuffledWords] = useState<VocabularyWord[]>([]);
  const [showSetup, setShowSetup] = useState(true);

  const words = selectedLevel === 'all'
    ? vocabulary.words
    : vocabulary.words.filter(w => w.cefrLevel === selectedLevel);

  const startSession = () => {
    const filtered = [...words].filter(w => !w.isLearned);
    if (filtered.length === 0) {
      addToast('No words to study! All words are learned.', 'info');
      return;
    }
    const shuffled = vocabulary.settings.shuffleCards
      ? filtered.sort(() => Math.random() - 0.5)
      : filtered;
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
    setSessionStats({ mastered: 0, review: 0 });
    setShowSetup(false);
  };

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleNext = (learned: boolean) => {
    const word = shuffledWords[currentIndex];

    if (learned) {
      vocabulary.updateWord(word.id, {
        isLearned: true,
        studyCount: word.studyCount + 1,
        correctCount: word.correctCount + 1,
        lastStudied: new Date().toISOString(),
      });
      setSessionStats(prev => ({ ...prev, mastered: prev.mastered + 1 }));
    } else {
      vocabulary.updateWord(word.id, {
        studyCount: word.studyCount + 1,
        lastStudied: new Date().toISOString(),
      });
      setSessionStats(prev => ({ ...prev, review: prev.review + 1 }));
    }

    if (currentIndex < shuffledWords.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setSessionComplete(true);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSetup || sessionComplete) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowLeft') {
        handleNext(false);
      } else if (e.code === 'ArrowRight') {
        handleNext(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSetup, sessionComplete, isFlipped, currentIndex, shuffledWords]);

  if (showSetup) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3DD]">
              <Bookmark className="h-8 w-8 text-[#F5A623]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A2E]">Flashcards</h2>
            <p className="mt-1 text-sm text-[#6B6B80]">
              {words.filter(w => !w.isLearned).length} words ready for review
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#1A1A2E]">Select Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level as CEFRLevel | 'all')}
                  className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-[#F5A623] text-white'
                      : 'bg-white border border-[#E5E5DD] text-[#6B6B80] hover:bg-[#F5F5F0]'
                  }`}
                >
                  {level === 'all' ? 'All' : level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full rounded-[10px] bg-[#F5A623] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E09400]"
          >
            Start Session
          </button>
        </div>
      </motion.div>
    );
  }

  if (sessionComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#F5A623', '#FFD700', '#FFA500', '#34C759'][i % 4],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative text-center space-y-6">
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Session Complete!</h2>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#34C759]">{sessionStats.mastered}</div>
              <div className="text-sm text-[#6B6B80]">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#F5A623]">{sessionStats.review}</div>
              <div className="text-sm text-[#6B6B80]">Need Review</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowSetup(true)}
              className="rounded-[10px] border border-[#E5E5DD] bg-white px-6 py-2.5 text-sm font-medium text-[#1A1A2E] hover:bg-[#F5F5F0]"
            >
              New Session
            </button>
            <button
              onClick={startSession}
              className="rounded-[10px] bg-[#F5A623] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#E09400]"
            >
              Study Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B6B80]">Card {currentIndex + 1} of {shuffledWords.length}</span>
          <span className="text-[#9B9BAE]">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#E5E5DD]">
          <motion.div
            className="h-full rounded-full bg-[#F5A623]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div
          className="flashcard-container w-full max-w-[480px] cursor-pointer"
          onClick={handleFlip}
          style={{ aspectRatio: '3/2' }}
        >
          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="flashcard-front flex flex-col items-center justify-center rounded-2xl border border-[#E5E5DD] bg-white p-8 shadow-sm">
              <h3 className="text-3xl font-bold text-[#1A1A2E]">{currentWord.word}</h3>
              <span className="mt-3 rounded-full bg-[#FFF3DD] px-4 py-1 text-sm font-medium text-[#B37600]">
                {currentWord.partOfSpeech}
              </span>
              {vocabulary.settings.showHints && (
                <p className="mt-auto text-xs text-[#9B9BAE]">Click to reveal</p>
              )}
            </div>

            {/* Back */}
            <div className="flashcard-back flex flex-col rounded-2xl border border-[#E5E5DD] bg-white p-6 shadow-sm overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-[#1A1A2E]">{currentWord.word}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(currentWord.word);
                  }}
                  className="rounded-lg p-2 text-[#9B9BAE] hover:bg-[#F5F5F0]"
                >
                  <Volume2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-sm font-medium text-[#1A1A2E] mb-2">{currentWord.definition}</p>

              {vocabulary.settings.showTranslations && (currentWord.laoTranslation || currentWord.thaiTranslation) && (
                <div className="mb-2 text-xs text-[#6B6B80]">
                  {currentWord.laoTranslation && <span>Lao: {currentWord.laoTranslation} </span>}
                  {currentWord.thaiTranslation && <span>Thai: {currentWord.thaiTranslation}</span>}
                </div>
              )}

              <p className="text-sm italic text-[#6B6B80] mb-3">
                &ldquo;{currentWord.exampleSentence}&rdquo;
              </p>

              {(currentWord.synonym || currentWord.antonym) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentWord.synonym && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#9B9BAE]">Syn:</span>
                      {currentWord.synonym.split(',').map((s, i) => (
                        <span key={i} className="rounded-full bg-[#FFF3DD] px-2 py-0.5 text-[11px] font-medium text-[#B37600]">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {currentWord.antonym && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-[#9B9BAE]">Ant:</span>
                      {currentWord.antonym.split(',').map((a, i) => (
                        <span key={i} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between">
                <span className="rounded-full bg-[#F5F5F0] px-3 py-1 text-[11px] font-semibold text-[#6B6B80]">
                  {currentWord.cefrLevel}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    vocabulary.toggleStar(currentWord.id);
                  }}
                  className="rounded-lg p-1.5"
                >
                  <Star
                    className={`h-4 w-4 ${currentWord.isStarred ? 'fill-[#F5A623] text-[#F5A623]' : 'text-[#9B9BAE]'}`}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleNext(false)}
          className="flex items-center gap-2 rounded-xl border-2 border-[#F5A623] bg-white px-8 py-3 text-sm font-semibold text-[#F5A623] transition-colors hover:bg-[#FFF3DD]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Still Learning
        </button>
        <button
          onClick={() => handleNext(true)}
          className="flex items-center gap-2 rounded-xl bg-[#F5A623] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E09400]"
        >
          Got It
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <p className="text-center text-xs text-[#9B9BAE]">
        Press Space to flip, Left arrow for "Still Learning", Right arrow for "Got It"
      </p>
    </div>
  );
}
