import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowRight,
  LayoutDashboard,
  Grid2x2,
  MessageSquare,
  CheckSquare,
  Gavel,
  Upload,
  Settings,
  Hash,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: 'dashboard' | 'matrix') => void;
  onImport: () => void;
}

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  action: () => void;
  section: string;
}

export default function CommandPalette({
  open,
  onClose,
  onNavigate,
  onImport,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { id: 'dashboard', label: 'Dashboard View', hint: 'Switch to split view', icon: LayoutDashboard, action: () => { onNavigate('dashboard'); onClose(); }, section: 'Views' },
    { id: 'matrix', label: 'Priority Matrix', hint: '2x2 Eisenhower matrix', icon: Grid2x2, action: () => { onNavigate('matrix'); onClose(); }, section: 'Views' },
    { id: 'import', label: 'Import Chat Export', hint: 'JSON / TXT / CSV', icon: Upload, action: () => { onImport(); onClose(); }, section: 'Actions' },
    { id: 'search-mentions', label: 'Filter: Mentions', hint: 'Show messages with @mentions', icon: MessageSquare, action: () => onClose(), section: 'Filters' },
    { id: 'search-deadlines', label: 'Filter: Deadlines', hint: 'Show time-sensitive items', icon: CheckSquare, action: () => onClose(), section: 'Filters' },
    { id: 'search-decisions', label: 'Filter: Decisions Made', hint: 'Show resolved decisions', icon: Gavel, action: () => onClose(), section: 'Filters' },
    { id: 'channel-eng', label: '#engineering-incidents', hint: '12 unread', icon: Hash, action: () => onClose(), section: 'Channels' },
    { id: 'channel-launch', label: '#product-launch', hint: '23 unread', icon: Hash, action: () => onClose(), section: 'Channels' },
    { id: 'channel-design', label: '#design-review', hint: '5 unread', icon: Hash, action: () => onClose(), section: 'Channels' },
    { id: 'settings', label: 'Privacy Settings', hint: 'Manage on-device processing', icon: Settings, action: () => onClose(), section: 'Settings' },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.hint?.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selectedIndex, filtered, onClose]);

  if (!open) return null;

  const sections = [...new Set(filtered.map((c) => c.section))];

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-base-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/4 z-50 w-[90%] max-w-lg -translate-x-1/2 animate-slide-up">
        <div className="overflow-hidden rounded-xl border border-base-600 bg-base-850 shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-base-700 px-4 py-3">
            <Search className="h-4 w-4 text-base-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search or type a command..."
              className="flex-1 bg-transparent text-sm text-white placeholder-base-500 focus:outline-none"
            />
            <kbd className="rounded border border-base-600 bg-base-700/50 px-1.5 py-0.5 text-[10px] font-medium text-base-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-base-500">
                No results found
              </div>
            ) : (
              sections.map((section) => (
                <div key={section} className="mb-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-base-600">
                    {section}
                  </div>
                  {filtered
                    .filter((c) => c.section === section)
                    .map((cmd) => {
                      const idx = filtered.indexOf(cmd);
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                            selectedIndex === idx
                              ? 'bg-base-700/80 text-white'
                              : 'text-base-300 hover:bg-base-800'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-base-400" />
                          <span className="flex-1 text-left text-[13px] font-medium">
                            {cmd.label}
                          </span>
                          {cmd.hint && (
                            <span className="text-[10px] text-base-500">{cmd.hint}</span>
                          )}
                          {selectedIndex === idx && (
                            <ArrowRight className="h-3.5 w-3.5 text-base-400" />
                          )}
                        </button>
                      );
                    })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-base-700 px-4 py-2">
            <div className="flex items-center gap-3 text-[10px] text-base-500">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-base-600 bg-base-700/50 px-1 py-0.5 text-[9px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-base-600 bg-base-700/50 px-1 py-0.5 text-[9px]">↵</kbd>
                Select
              </span>
            </div>
            <span className="text-[10px] font-medium text-base-600">ChatPulse</span>
          </div>
        </div>
      </div>
    </>
  );
}
