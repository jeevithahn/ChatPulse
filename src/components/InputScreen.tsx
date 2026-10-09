import { useState, useRef } from 'react';
import {
  Shield,
  Lock,
  Cpu,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Zap,
  CheckSquare,
  Gavel,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { SAMPLE_CONVERSATION } from '../analyzer';

interface InputScreenProps {
  onAnalyze: (rawText: string) => void;
  isAnalyzing: boolean;
}

export default function InputScreen({ onAnalyze, isAnalyzing }: InputScreenProps) {
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const canAnalyze = text.trim().length > 10 && !isAnalyzing;

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-base-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-base-700 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-500/20">
            <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-white leading-none">ChatPulse</span>
            <span className="text-[10px] font-medium text-base-500 leading-none mt-0.5">On-Device Intelligence</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold text-emerald-400">Local Engine: Active</span>
        </div>
      </div>

      {/* Hero + Input */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {/* Hero */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-base-700 bg-base-850/60 px-3 py-1.5">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span className="text-[11px] font-semibold text-emerald-400">100% On-Device AI · Zero Data Sent to Cloud</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Paste your conversation.<br />
              <span className="text-gradient">Get instant intelligence.</span>
            </h1>
            <p className="mt-3 text-[14px] text-base-400 max-w-xl mx-auto">
              ChatPulse analyzes dense chat exports — Slack, Discord, Teams — and extracts
              action items, decisions, deadlines, and priority scores. All processing happens in your browser.
            </p>
          </div>

          {/* Input card */}
          <div
            className={`rounded-2xl border bg-base-850/60 transition-all ${
              dragOver ? 'border-accent-500/50 shadow-lg shadow-accent-500/10' : 'border-base-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-base-700 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-base-400" />
                <span className="text-[12px] font-semibold text-base-300">Paste conversation or drop a file</span>
                {fileName && (
                  <span className="rounded bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-400">
                    {fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md border border-base-700 bg-base-800/60 px-2.5 py-1.5 text-[11px] font-medium text-base-300 transition-all hover:border-accent-500/40 hover:text-accent-400"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <button
                  onClick={() => { setText(SAMPLE_CONVERSATION); setFileName(''); }}
                  className="rounded-md border border-base-700 bg-base-800/60 px-2.5 py-1.5 text-[11px] font-medium text-base-300 transition-all hover:border-base-600 hover:text-white"
                >
                  Try Sample
                </button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setFileName(''); }}
              placeholder={`Paste your chat export here...\n\nSupported formats:\n• Slack JSON export\n• Plain text: [9:41 AM] Author: message\n• Discord/IRC: <Author> message\n• Simple: Author: message\n\nOr click "Try Sample" to see it in action.`}
              className="h-64 w-full resize-none bg-transparent p-4 text-[13px] leading-relaxed text-base-200 placeholder-base-600 focus:outline-none"
            />

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-base-700 px-4 py-3">
              <div className="flex items-center gap-3 text-[10px] font-medium text-base-500">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-accent-400" />
                  WebLLM Engine
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  0 bytes sent
                </span>
                {text.trim().length > 0 && (
                  <span className="text-base-400">{text.length.toLocaleString()} chars</span>
                )}
              </div>
              <button
                onClick={() => canAnalyze && onAnalyze(text)}
                disabled={!canAnalyze}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                  canAnalyze
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/20 hover:from-accent-400 hover:to-accent-500'
                    : 'cursor-not-allowed bg-base-800 text-base-600'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing on-device...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Conversation
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feature preview */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Zap, label: 'Urgency Scoring', desc: 'AI-ranked 0-100', color: 'text-rose-400' },
              { icon: CheckSquare, label: 'Action Items', desc: 'Owners & deadlines', color: 'text-blue-400' },
              { icon: Gavel, label: 'Decisions', desc: 'Resolved debates', color: 'text-emerald-400' },
              { icon: AlertTriangle, label: 'Alerts', desc: 'Missed mentions', color: 'text-amber-400' },
            ].map((feature) => {
  const Icon = feature.icon;
  return (
                <div key={feature.label} className="rounded-xl border border-base-700 bg-base-850/40 p-3 transition-all hover:border-base-600">
                  <Icon className={`h-4 w-4 ${feature.color}`} />
                  <div className="mt-2 text-[12px] font-semibold text-white">{feature.label}</div>
                  <div className="text-[10px] text-base-500">{feature.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
