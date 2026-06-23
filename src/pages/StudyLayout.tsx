import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, HelpCircle, Puzzle, Keyboard, ArrowLeft } from 'lucide-react';

const studyModes = [
  { path: '/study/flashcards', label: 'Flashcards', icon: Layers, description: 'Flip cards to test memory' },
  { path: '/study/quiz', label: 'Quiz', icon: HelpCircle, description: 'Multiple choice questions' },
  { path: '/study/matching', label: 'Matching', icon: Puzzle, description: 'Match words & definitions' },
  { path: '/study/spelling', label: 'Spelling', icon: Keyboard, description: 'Type the correct word' },
];

export function StudyLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootStudy = location.pathname === '/study';

  if (isRootStudy) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A2E]">Study</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">Choose a study mode to practice your vocabulary</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {studyModes.map((mode, i) => (
            <motion.button
              key={mode.path}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.1 }}
              onClick={() => navigate(mode.path)}
              className="card-hover flex items-center gap-4 rounded-2xl border border-[#E5E5DD] bg-white p-6 text-left"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FFF3DD]">
                <mode.icon className="h-7 w-7 text-[#F5A623]" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A1A2E]">{mode.label}</h3>
                <p className="text-sm text-[#6B6B80]">{mode.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Show the study mode content
  const currentMode = studyModes.find(m => location.pathname.includes(m.path.split('/').pop()!));

  return (
    <div className="space-y-4">
      {/* Study Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/study')}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E5DD] bg-white text-[#6B6B80] hover:bg-[#F5F5F0]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A2E]">{currentMode?.label}</h1>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
