import { useState } from 'react';
import {
  Zap,
  Target,
  Inbox,
  Coffee,
  ArrowUpRight,
  ArrowUpLeft,
  User,
  Clock,
  MessageSquare,
  CheckSquare,
  ListTree,
} from 'lucide-react';
import type { PriorityItem } from '../types';

interface PriorityMatrixProps {
  items: PriorityItem[];
}

interface QuadrantConfig {
  title: string;
  subtitle: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  border: string;
  accent: string;
}

const quadrantConfig: Record<string, QuadrantConfig> = {
  'urgent-important': {
    title: 'Do Now',
    subtitle: 'Urgent + Important',
    icon: Zap,
    color: 'text-rose-400',
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20',
    accent: 'bg-rose-500',
  },
  'not-urgent-important': {
    title: 'Schedule',
    subtitle: 'Important · Not Urgent',
    icon: Target,
    color: 'text-accent-400',
    bg: 'bg-accent-500/5',
    border: 'border-accent-500/20',
    accent: 'bg-accent-500',
  },
  'urgent-not-important': {
    title: 'Delegate',
    subtitle: 'Urgent · Not Important',
    icon: Inbox,
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    accent: 'bg-amber-500',
  },
  'not-urgent-not-important': {
    title: 'Backlog',
    subtitle: 'Not Urgent · Not Important',
    icon: Coffee,
    color: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    accent: 'bg-blue-500',
  },
};

const typeIcon = {
  message: MessageSquare,
  task: CheckSquare,
  thread: ListTree,
};

export default function PriorityMatrix({ items }: PriorityMatrixProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const quadrants = {
    'urgent-important': items.filter((p) => p.urgent && p.important),
    'not-urgent-important': items.filter((p) => !p.urgent && p.important),
    'urgent-not-important': items.filter((p) => p.urgent && !p.important),
    'not-urgent-not-important': items.filter((p) => !p.urgent && !p.important),
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Priority & Urgency Matrix</h2>
          <p className="text-[12px] text-base-400">
            AI-categorized by urgency and importance — {items.length} items analyzed on-device
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-base-700 bg-base-800/60 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-500">Eisenhower Method</span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3" style={{ minHeight: '500px' }}>
        <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-base-600 bg-base-850">
          <span className="text-[9px] font-bold text-base-400">AI</span>
        </div>

        <Quadrant config={quadrantConfig['urgent-important']} items={quadrants['urgent-important']} hovered={hovered} onHover={setHovered} />
        <Quadrant config={quadrantConfig['not-urgent-important']} items={quadrants['not-urgent-important']} hovered={hovered} onHover={setHovered} />
        <Quadrant config={quadrantConfig['urgent-not-important']} items={quadrants['urgent-not-important']} hovered={hovered} onHover={setHovered} />
        <Quadrant config={quadrantConfig['not-urgent-not-important']} items={quadrants['not-urgent-not-important']} hovered={hovered} onHover={setHovered} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-base-500">
          <ArrowUpRight className="h-3 w-3 text-rose-400" /> Urgent
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-base-500">
          Important <ArrowUpLeft className="h-3 w-3 text-accent-400" />
        </div>
      </div>
    </div>
  );
}

function Quadrant({
  config,
  items,
  hovered,
  onHover,
}: {
  config: QuadrantConfig;
  items: PriorityItem[];
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-3 transition-all`}>
      <div className="mb-2.5 flex items-center gap-2">
        <div className={`flex h-6 w-6 items-center justify-center rounded ${config.bg} border ${config.border}`}>
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        </div>
        <div>
          <div className="text-[13px] font-bold text-white">{config.title}</div>
          <div className="text-[9px] font-medium text-base-500">{config.subtitle}</div>
        </div>
        <span className={`ml-auto rounded-full ${config.bg} px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const TIcon = typeIcon[item.type];
          return (
            <div
              key={item.id}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onHover(null)}
              className="group relative rounded-lg border border-base-700/50 bg-base-850/60 p-2.5 transition-all hover:border-base-600 hover:bg-base-850 cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <TIcon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium leading-snug text-base-200">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[9px] text-base-500">
                      <span className={`font-bold ${config.color}`}>{item.score}</span>
                      <span>/100</span>
                    </span>
                    {item.owner && (
                      <span className="flex items-center gap-1 text-[9px] text-base-500">
                        <User className="h-2 w-2" />
                        {item.owner}
                      </span>
                    )}
                    {item.deadline && (
                      <span className="flex items-center gap-1 text-[9px] text-base-500">
                        <Clock className="h-2 w-2" />
                        {item.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`h-full w-0.5 rounded-full ${config.accent} opacity-50`} />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="flex h-20 items-center justify-center text-[11px] text-base-600">
            No items in this quadrant
          </div>
        )}
      </div>
    </div>
  );
}
