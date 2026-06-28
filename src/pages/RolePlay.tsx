/**
 * RolePlay — AI Speaking Practice (Elsa-style)
 *
 * Pipeline:
 *  1. User speaks → MediaRecorder → audio Blob
 *  2. Blob → Groq Whisper API → transcribed text
 *  3. Text → Gemini Flash API → AI persona reply
 *  4. Reply → ElevenLabs TTS API → audio → play back
 *
 * API Keys are entered once in the Settings panel inside this page.
 * Keys are stored in localStorage (never sent anywhere except the named APIs).
 *
 * Scenarios: Free conversation / Job Interview / Restaurant / Travel / Shopping
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, Settings, ChevronDown,
  Send, Loader2, AlertCircle, CheckCircle2, KeyRound,
  RefreshCw, BookOpen, Briefcase, UtensilsCrossed, Plane, ShoppingBag,
  X, Info,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  timestamp: Date;
}

interface APIKeys {
  groq: string;
  gemini: string;
  elevenlabs: string;
  elevenlabsVoice: string;
}

const KEYS_STORAGE = 'moe_roleplay_keys';

const SCENARIOS = [
  { id: 'free',        label: 'Free Talk',      icon: BookOpen,         color: 'bg-blue-50 text-blue-600',
    prompt: 'You are a friendly English conversation partner. Keep responses concise (2-3 sentences). Gently correct grammar mistakes by rephrasing naturally. Focus on vocabulary from everyday topics.' },
  { id: 'interview',  label: 'Job Interview',  icon: Briefcase,        color: 'bg-purple-50 text-purple-600',
    prompt: 'You are a professional interviewer conducting an English job interview. Ask one question at a time. Give brief feedback on the candidate\'s answer before asking the next question. Keep responses under 3 sentences.' },
  { id: 'restaurant', label: 'Restaurant',     icon: UtensilsCrossed,  color: 'bg-amber-50 text-amber-600',
    prompt: 'You are a friendly restaurant server in an English-speaking country. Help the user practice ordering food, asking about the menu, and making requests. Keep responses natural and brief (2-3 sentences).' },
  { id: 'travel',     label: 'Travel',         icon: Plane,            color: 'bg-teal-50 text-teal-600',
    prompt: 'You are a helpful airport/hotel staff member. Help the user practice travel English: check-in, directions, bookings, and tourist questions. Keep responses concise and natural.' },
  { id: 'shopping',   label: 'Shopping',       icon: ShoppingBag,      color: 'bg-rose-50 text-rose-600',
    prompt: 'You are a helpful shop assistant in an English store. Help the user practice shopping conversations: asking about products, prices, sizes, and making purchases. Keep responses brief and natural.' },
];

const DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // ElevenLabs "Sarah" voice

// ── API calls ─────────────────────────────────────────────────────────────────

async function transcribeAudio(audioBlob: Blob, groqKey: string): Promise<string> {
  const form = new FormData();
  form.append('file', new File([audioBlob], 'audio.webm', { type: audioBlob.type }));
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'en');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Groq error ${res.status}`);
  }
  const data = await res.json();
  return data.text?.trim() || '';
}

async function getAIReply(
  userText: string,
  history: Message[],
  systemPrompt: string,
  geminiKey: string,
): Promise<string> {
  // Build conversation history for Gemini
  const contents = history.slice(-8).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 200, temperature: 0.8 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'I didn\'t understand that. Could you repeat?';
}

async function textToSpeech(text: string, elevenKey: string, voiceId: string): Promise<string> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': elevenKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.detail?.message || `ElevenLabs error ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RolePlay() {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [scenarioId, setScenarioId]       = useState('free');
  const [recording, setRecording]         = useState(false);
  const [processing, setProcessing]       = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError]                 = useState('');
  const [showSettings, setShowSettings]   = useState(false);
  const [showScenario, setShowScenario]   = useState(false);
  const [audioLevel, setAudioLevel]       = useState(0);

  const [keys, setKeys] = useState<APIKeys>(() => {
    try { return JSON.parse(localStorage.getItem(KEYS_STORAGE) || '{}'); } catch { return {}; }
  });
  const [draftKeys, setDraftKeys] = useState<APIKeys>({ ...keys, elevenlabsVoice: keys.elevenlabsVoice || DEFAULT_VOICE });

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
  const hasKeys = !!(keys.groq && keys.gemini && keys.elevenlabs);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Level meter animation
  const animateLevels = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAudioLevel(avg / 128);
    animFrameRef.current = requestAnimationFrame(animateLevels);
  }, []);

  const startRecording = async () => {
    if (!hasKeys) { setShowSettings(true); return; }
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up analyser for level meter
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      animFrameRef.current = requestAnimationFrame(animateLevels);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
        stream.getTracks().forEach(t => t.stop());
        ctx.close();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(blob);
      };
      recorder.start(250);
      mediaRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    setProcessing(true);
  };

  const processAudio = async (blob: Blob) => {
    const userMsgId = Date.now().toString();
    try {
      // Step 1: STT
      setProcessingStep('🎙 Transcribing…');
      const transcript = await transcribeAudio(blob, keys.groq);
      if (!transcript) { setError('Could not hear speech. Please speak clearly and try again.'); setProcessing(false); return; }

      const userMsg: Message = { id: userMsgId, role: 'user', text: transcript, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);

      // Step 2: LLM
      setProcessingStep('🤖 Thinking…');
      const currentHistory = messages;
      const aiText = await getAIReply(transcript, currentHistory, scenario.prompt, keys.gemini);

      // Step 3: TTS
      setProcessingStep('🔊 Generating speech…');
      const audioUrl = await textToSpeech(aiText, keys.elevenlabs, keys.elevenlabsVoice || DEFAULT_VOICE);

      const aiMsg: Message = { id: Date.now().toString() + '_ai', role: 'ai', text: aiText, audioUrl, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);

      // Auto-play AI voice
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  const playMessage = (url: string) => {
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
  };

  const saveKeys = () => {
    const k = { ...draftKeys };
    if (!k.elevenlabsVoice) k.elevenlabsVoice = DEFAULT_VOICE;
    setKeys(k);
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(k));
    setShowSettings(false);
  };

  const resetConversation = () => {
    setMessages([]);
    setError('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] space-y-0">

      {/* Header */}
      <div className="flex items-center justify-between px-1 py-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Mic className="h-5 w-5 text-[#F5A623]" strokeWidth={1.5} />
            Speaking Practice
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Talk with an AI tutor · get instant feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetConversation} title="Reset conversation"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowSettings(true)}
            className={`p-2 rounded-lg border transition-colors ${hasKeys ? 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50' : 'border-[#F5A623] text-[#F5A623] bg-[#FFF3DD]'}`}>
            <KeyRound className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex-shrink-0">
        <div className="relative">
          <button onClick={() => setShowScenario(!showScenario)}
            className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${scenario.color}`}>
              <scenario.icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-left">{scenario.label}</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showScenario ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showScenario && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1 w-full z-30 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => { setScenarioId(s.id); setShowScenario(false); resetConversation(); }}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left ${
                      s.id === scenarioId ? 'bg-[#FFF3DD] text-foreground' : 'hover:bg-muted/40 text-foreground'
                    }`}>
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${s.color}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    {s.label}
                    {s.id === scenarioId && <CheckCircle2 className="h-4 w-4 text-[#F5A623] ml-auto" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* No keys warning */}
      {!hasKeys && (
        <div className="flex-shrink-0 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>API keys required.</strong> Tap the <KeyRound className="h-3.5 w-3.5 inline mx-0.5" /> key icon above to enter your free Groq, Gemini, and ElevenLabs API keys.
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <div className="h-16 w-16 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
              <Mic className="h-7 w-7 text-[#F5A623]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Start speaking!</p>
              <p className="text-sm text-muted-foreground mt-1">Hold the mic button and talk.<br/>The AI tutor will reply in English.</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${scenario.color}`}>
              <scenario.icon className="h-3.5 w-3.5" /> {scenario.label} mode
            </div>
          </div>
        )}

        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#1A1A2E] text-white rounded-br-sm'
                : 'bg-card border border-border text-foreground rounded-bl-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-between mt-2 gap-3">
                <span className="text-[10px] opacity-50">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.audioUrl && (
                  <button onClick={() => playMessage(msg.audioUrl!)}
                    className="flex items-center gap-1 text-[10px] font-medium text-[#F5A623] hover:text-[#E09400] transition-colors">
                    <Volume2 className="h-3.5 w-3.5" /> Replay
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Processing indicator */}
        {processing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#F5A623]" />
              <span className="text-sm text-muted-foreground">{processingStep || 'Processing…'}</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mic button */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3 pb-4 pt-2">
        {/* Audio level bars */}
        {recording && (
          <div className="flex items-center gap-1 h-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}
                className="w-1.5 rounded-full bg-[#F5A623] transition-all"
                style={{ height: `${Math.max(4, Math.min(24, audioLevel * 24 * (0.5 + Math.sin(i * 0.8 + Date.now() / 200) * 0.5)))}px` }}
              />
            ))}
          </div>
        )}

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={e => { e.preventDefault(); startRecording(); }}
          onTouchEnd={e => { e.preventDefault(); stopRecording(); }}
          disabled={processing || !hasKeys}
          className={`h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg select-none ${
            recording
              ? 'bg-red-500 shadow-red-500/40 scale-110 ring-4 ring-red-500/30'
              : processing
              ? 'bg-muted cursor-wait'
              : hasKeys
              ? 'bg-[#1A1A2E] hover:bg-[#252540] shadow-[#1A1A2E]/30 active:scale-95 cursor-pointer'
              : 'bg-muted cursor-not-allowed opacity-50'
          }`}
        >
          {processing
            ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            : recording
            ? <MicOff className="h-8 w-8 text-white" strokeWidth={1.5} />
            : <Mic className="h-8 w-8 text-[#F5A623]" strokeWidth={1.5} />
          }
        </button>
        <p className="text-xs text-muted-foreground text-center">
          {recording ? '🔴 Recording… release to send'
           : processing ? processingStep
           : hasKeys ? 'Hold to speak · release to send'
           : 'Set up API keys to start'}
        </p>
      </div>

      {/* ── Settings Modal ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl border border-border p-6 space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">API Keys Setup</h2>
                <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Groq */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Groq API Key</label>
                  <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#4A90E2] hover:underline">Get free key →</a>
                </div>
                <input type="password" placeholder="gsk_…"
                  value={draftKeys.groq || ''}
                  onChange={e => setDraftKeys(k => ({ ...k, groq: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40" />
                <p className="text-xs text-muted-foreground">Used for speech-to-text (Whisper). Free tier: 2000 min/month.</p>
              </div>

              {/* Gemini */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Gemini API Key</label>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#4A90E2] hover:underline">Get free key →</a>
                </div>
                <input type="password" placeholder="AIza…"
                  value={draftKeys.gemini || ''}
                  onChange={e => setDraftKeys(k => ({ ...k, gemini: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40" />
                <p className="text-xs text-muted-foreground">Used for AI conversation (Gemini Flash). Free tier: 1500 req/day.</p>
              </div>

              {/* ElevenLabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">ElevenLabs API Key</label>
                  <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#4A90E2] hover:underline">Get free key →</a>
                </div>
                <input type="password" placeholder="…"
                  value={draftKeys.elevenlabs || ''}
                  onChange={e => setDraftKeys(k => ({ ...k, elevenlabs: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40" />
                <p className="text-xs text-muted-foreground">Used for AI voice (TTS). Free tier: 10 000 chars/month.</p>
              </div>

              {/* Voice ID */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">ElevenLabs Voice ID <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input type="text" placeholder={DEFAULT_VOICE}
                  value={draftKeys.elevenlabsVoice || ''}
                  onChange={e => setDraftKeys(k => ({ ...k, elevenlabsVoice: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 font-mono" />
                <p className="text-xs text-muted-foreground">Default: "Sarah" voice. Find IDs at elevenlabs.io/voice-library.</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-800">
                  🔒 Keys are stored only in this browser's localStorage and sent only to the respective APIs. They are never shared with anyone.
                </p>
              </div>

              <button onClick={saveKeys}
                className="w-full py-3 bg-[#F5A623] text-white rounded-xl text-sm font-bold hover:bg-[#E09400] transition-colors flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> Save & Start Practicing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
