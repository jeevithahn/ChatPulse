import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Search,
  Upload,
  Lock,
  Command,
} from 'lucide-react';

interface NavbarProps {
  onOpenCommand: () => void;
  onImport: () => void;
}

export default function Navbar({ onOpenCommand, onImport }: NavbarProps) {
  const [privacyOn, setPrivacyOn] = useState(true);

  return (
    <header className="sticky top-0 z-40 border-b border-base-700 bg-base-950/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left: Logo + Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-500/20">
              <Shield className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-white leading-none">
                ChatPulse
              </span>
              <span className="text-[10px] font-medium text-base-500 leading-none mt-0.5">
                On-Device Intelligence
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 ml-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              Local Engine: Active
            </span>
          </div>
        </div>

        {/* Center: Search / Command Bar */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <button
            onClick={onOpenCommand}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-base-700 bg-base-800/60 px-3.5 py-2 text-left transition-all hover:border-base-600 hover:bg-base-800"
          >
            <Search className="h-4 w-4 text-base-500 group-hover:text-base-400" />
            <span className="flex-1 text-sm text-base-500">Search threads, tasks, decisions...</span>
            <kbd className="flex items-center gap-0.5 rounded border border-base-600 bg-base-700/50 px-1.5 py-0.5 text-[10px] font-medium text-base-400">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>

        {/* Right: Import + Privacy */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-base-700 bg-base-800/60 px-2.5 py-1">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
              100% On-Device AI · Zero Data Sent to Cloud
            </span>
          </div>

          <button
            onClick={onImport}
            className="group flex items-center gap-2 rounded-lg border border-base-700 bg-base-800/60 px-3 py-2 transition-all hover:border-accent-500/40 hover:bg-base-800"
          >
            <Upload className="h-4 w-4 text-base-400 group-hover:text-accent-400" />
            <span className="hidden md:inline text-xs font-medium text-base-300 group-hover:text-white">
              Import Chat Export
            </span>
            <span className="hidden lg:inline text-[10px] font-medium text-base-500">
              JSON/TXT/CSV
            </span>
          </button>

          <button
            onClick={() => setPrivacyOn(!privacyOn)}
            className="flex items-center gap-2 rounded-lg border border-base-700 bg-base-800/60 px-3 py-2 transition-all hover:border-base-600"
            title="Privacy Settings"
          >
            <div className={`flex items-center gap-1.5 ${privacyOn ? 'text-emerald-400' : 'text-base-500'}`}>
              {privacyOn ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </div>
            <div className="hidden xl:flex items-center gap-1.5">
              <div className={`h-4 w-7 rounded-full transition-colors ${privacyOn ? 'bg-emerald-500/30' : 'bg-base-600'}`}>
                <div className={`h-3 w-3 rounded-full transition-transform mt-0.5 ${privacyOn ? 'translate-x-3.5 bg-emerald-400' : 'translate-x-0.5 bg-base-400'}`} />
              </div>
              <span className={`text-[10px] font-semibold ${privacyOn ? 'text-emerald-400' : 'text-base-500'}`}>
                {privacyOn ? 'Private' : 'Off'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
