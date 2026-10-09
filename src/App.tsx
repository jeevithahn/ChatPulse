import { useState, useEffect } from 'react';
import { LayoutDashboard, Grid2x2, Cpu, ShieldCheck, RotateCcw, Plus } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ConversationStream from './components/ConversationStream';
import IntelligencePanel from './components/IntelligencePanel';
import PriorityMatrix from './components/PriorityMatrix';
import CommandPalette from './components/CommandPalette';
import InputScreen from './components/InputScreen';
import { analyzeConversation, type AnalysisResult } from './analyzer';
import type { FilterType, ViewMode, Message, ActionItem, Decision, Alert, PriorityItem } from './types';

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [commandOpen, setCommandOpen] = useState(false);
  const [filters, setFilters] = useState<Record<FilterType, boolean>>({
    mentions: false,
    deadlines: false,
    decisions: false,
    actionItems: false,
  });

  const toggleFilter = (filter: FilterType) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAnalyze = (rawText: string) => {
    setIsAnalyzing(true);
    // Simulate processing time for UI feedback
    setTimeout(() => {
      const result = analyzeConversation(rawText);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleReset = () => {
    setAnalysis(null);
    setView('dashboard');
    setFilters({ mentions: false, deadlines: false, decisions: false, actionItems: false });
  };

  if (!analysis) {
    return <InputScreen onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-base-950 text-base-200">
      <Navbar
        onOpenCommand={() => setCommandOpen(true)}
        onImport={handleReset}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          channels={buildChannels(analysis)}
          activeChannel="imported"
          onSelectChannel={() => {}}
          filters={filters}
          onToggleFilter={toggleFilter}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* View Toggle Bar */}
          <div className="flex items-center justify-between border-b border-base-700 bg-base-900/30 px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  view === 'dashboard' ? 'bg-base-800 text-white' : 'text-base-400 hover:text-base-300'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => setView('matrix')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  view === 'matrix' ? 'bg-base-800 text-white' : 'text-base-400 hover:text-base-300'
                }`}
              >
                <Grid2x2 className="h-3.5 w-3.5" />
                Priority Matrix
              </button>
              <button
                onClick={handleReset}
                className="ml-2 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-base-400 transition-colors hover:bg-base-800 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                New Analysis
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-base-500">
                <Cpu className="h-3 w-3 text-accent-400" />
                <span>WebLLM Engine · Analyzed {analysis.messages.length} messages</span>
              </div>
              <span className="h-3 w-px bg-base-700" />
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                <span>0 bytes transmitted</span>
              </div>
            </div>
          </div>

          {view === 'dashboard' ? (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-hidden border-r border-base-700">
                <ConversationStream
                  messages={analysis.messages}
                  channelName={analysis.channelName}
                  filters={filters}
                />
              </div>
              <div className="w-[440px] flex-shrink-0 overflow-hidden">
                <IntelligencePanel
                  execSummary={analysis.execSummary}
                  actionItems={analysis.actionItems}
                  decisions={analysis.decisions}
                  alerts={analysis.alerts}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <PriorityMatrix items={analysis.priorityItems} />
            </div>
          )}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={setView}
        onImport={handleReset}
      />
    </div>
  );
}

function buildChannels(analysis: AnalysisResult) {
  const high = analysis.messages.filter((m) => m.urgency === 'high').length;
  const medium = analysis.messages.filter((m) => m.urgency === 'medium').length;
  const low = analysis.messages.filter((m) => m.urgency === 'low').length;

  return [
    {
      id: 'imported',
      name: analysis.channelName,
      type: 'channel' as const,
      unreadCount: analysis.messages.length,
      urgency: 'high' as const,
      lastActivity: 'just now',
    },
    {
      id: 'high-urgency',
      name: 'high-urgency',
      type: 'channel' as const,
      unreadCount: high,
      urgency: 'high' as const,
      lastActivity: 'just now',
    },
    {
      id: 'action-needed',
      name: 'action-needed',
      type: 'channel' as const,
      unreadCount: medium,
      urgency: 'medium' as const,
      lastActivity: 'just now',
    },
    {
      id: 'fyi',
      name: 'fyi',
      type: 'channel' as const,
      unreadCount: low,
      urgency: 'low' as const,
      lastActivity: 'just now',
    },
  ];
}
