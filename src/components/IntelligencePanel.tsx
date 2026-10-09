import { useState } from 'react';
import {
  Sparkles,
  CheckSquare,
  Square,
  Gavel,
  AlertTriangle,
  Bell,
  Clock,
  AtSign,
  ShieldAlert,
  Copy,
  Check,
  Users,
  Vote,
  Zap,
  Inbox,
} from 'lucide-react';
import type { ActionItem, Decision, Alert } from '../types';

interface IntelligencePanelProps {
  execSummary: string[];
  actionItems: ActionItem[];
  decisions: Decision[];
  alerts: Alert[];
}

export default function IntelligencePanel({
  execSummary,
  actionItems: initialItems,
  decisions,
  alerts,
}: IntelligencePanelProps) {
  const [copied, setCopied] = useState(false);
  const [items, setItems] = useState(initialItems);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'completed' ? 'pending' : 'completed',
            }
          : item,
      ),
    );
  };

  const handleCopy = () => {
    const report = generateReport(items, execSummary, decisions, alerts);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-700 bg-base-900/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-accent-400 to-accent-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-white">Executive Intelligence</span>
          <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[9px] font-bold text-accent-400">
            AI-Generated
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-base-700 bg-base-800/60 px-2.5 py-1.5 text-[11px] font-medium text-base-300 transition-all hover:border-accent-500/40 hover:text-accent-400"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Report
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {alerts.length > 0 && <AlertBanner alerts={alerts} />}
        <ExecutiveSummary points={execSummary} />
        {items.length > 0 && (
          <ActionItems items={items} completedCount={completedCount} onToggle={toggleItem} />
        )}
        {decisions.length > 0 && <DecisionsGrid decisions={decisions} />}
        {items.length === 0 && decisions.length === 0 && alerts.length === 0 && (
          <div className="rounded-xl border border-base-700 bg-base-800/40 p-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-base-600" />
            <p className="mt-3 text-[13px] font-medium text-base-400">No action items, decisions, or alerts detected.</p>
            <p className="mt-1 text-[11px] text-base-500">This conversation appears to be purely informational.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  const iconMap = {
    mention: AtSign,
    deadline: Clock,
    risk: ShieldAlert,
    escalation: AlertTriangle,
  };

  return (
    <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent p-3 animate-slide-up">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/20">
          <Bell className="h-3 w-3 text-rose-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
          Alerts & Missed Mentions
        </span>
        <span className="ml-auto rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
          {alerts.length} active
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          const colorMap = {
            high: 'text-rose-400',
            medium: 'text-amber-400',
            low: 'text-blue-400',
          };
          return (
            <div
              key={alert.id}
              className="group flex items-start gap-2 rounded-lg bg-base-850/60 p-2.5 transition-colors hover:bg-base-850"
            >
              <Icon className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${colorMap[alert.severity]}`} />
              <div className="flex-1">
                <p className="text-[12px] leading-relaxed text-base-200">{alert.message}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-base-500">
                  <span className="font-medium text-base-400">#{alert.channel}</span>
                  {alert.timestamp && (
                    <>
                      <span>·</span>
                      <span>{alert.timestamp}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExecutiveSummary({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <div className="rounded-xl border border-base-700 bg-base-800/40 p-4 animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-accent-500/20">
          <Sparkles className="h-3 w-3 text-accent-400" />
        </div>
        <span className="text-[12px] font-bold text-white">Executive Summary</span>
        <span className="text-[10px] font-medium text-base-500">{points.length} key points</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {points.map((point, i) => (
          <div key={i} className="group flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-base-800/60">
            <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-[9px] font-bold text-white">
              {i + 1}
            </div>
            <p className="text-[12px] leading-relaxed text-base-300 group-hover:text-base-200">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionItems({
  items,
  completedCount,
  onToggle,
}: {
  items: ActionItem[];
  completedCount: number;
  onToggle: (id: string) => void;
}) {
  const priorityConfig = {
    high: { color: 'text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-500' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'text-base-400' },
    'in-progress': { label: 'In Progress', color: 'text-amber-400' },
    completed: { label: 'Done', color: 'text-emerald-400' },
  };

  return (
    <div className="rounded-xl border border-base-700 bg-base-800/40 p-4 animate-slide-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20">
            <CheckSquare className="h-3 w-3 text-blue-400" />
          </div>
          <span className="text-[12px] font-bold text-white">Action Items</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-base-500">
            {completedCount}/{items.length} done
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-base-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const p = priorityConfig[item.priority];
          const s = statusConfig[item.status];
          const done = item.status === 'completed';
          return (
            <div
              key={item.id}
              className="group flex items-start gap-2.5 rounded-lg p-2.5 transition-colors hover:bg-base-800/60 cursor-pointer"
              onClick={() => onToggle(item.id)}
            >
              <button className="mt-0.5 flex-shrink-0">
                {done ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4 text-base-600 hover:text-base-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] leading-snug ${done ? 'text-base-500 line-through' : 'text-base-200'}`}>
                  {item.description}
                </p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 text-[10px] font-medium ${p.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                    {item.owner}
                  </span>
                  <span className="text-base-600">·</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-base-400">
                    <Clock className="h-2.5 w-2.5" />
                    {item.deadline}
                  </span>
                  <span className={`ml-auto text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionsGrid({ decisions }: { decisions: Decision[] }) {
  const consensusConfig = {
    unanimous: { label: 'Unanimous', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Vote },
    majority: { label: 'Majority Vote', color: 'text-accent-400', bg: 'bg-accent-500/10', icon: Vote },
    override: { label: 'Lead Override', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Zap },
  };

  return (
    <div className="rounded-xl border border-base-700 bg-base-800/40 p-4 animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20">
          <Gavel className="h-3 w-3 text-emerald-400" />
        </div>
        <span className="text-[12px] font-bold text-white">Key Decisions</span>
        <span className="text-[10px] font-medium text-base-500">{decisions.length} resolved</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {decisions.map((decision) => {
          const c = consensusConfig[decision.consensus];
          const CIcon = c.icon;
          return (
            <div
              key={decision.id}
              className="group rounded-lg border border-base-700 bg-base-900/40 p-3 transition-all hover-card"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-white">{decision.title}</span>
                <span className={`flex items-center gap-1 rounded-full ${c.bg} px-2 py-0.5 text-[9px] font-bold ${c.color}`}>
                  <CIcon className="h-2.5 w-2.5" />
                  {c.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-base-400">{decision.summary}</p>
              <div className="mt-2 flex items-center gap-2">
                <Users className="h-3 w-3 text-base-500" />
                <span className="text-[10px] text-base-500">{decision.participants.join(', ')}</span>
                <span className="ml-auto text-[10px] text-base-500">Resolved {decision.resolvedAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateReport(
  items: ActionItem[],
  execSummary: string[],
  decisions: Decision[],
  alerts: Alert[],
): string {
  const completed = items.filter((i) => i.status === 'completed');
  const pending = items.filter((i) => i.status !== 'completed');

  return `CHATPULSE — EXECUTIVE INTELLIGENCE REPORT
Generated: ${new Date().toLocaleString()}
Processing: 100% On-Device AI (Zero Data Sent to Cloud)

=== EXECUTIVE SUMMARY ===
${execSummary.map((p, i) => `${i + 1}. ${p}`).join('\n')}

=== ACTION ITEMS ===
Completed: ${completed.length}/${items.length}
${pending.map((i) => `[${i.priority.toUpperCase()}] ${i.description} — Owner: ${i.owner} — Deadline: ${i.deadline}`).join('\n')}

=== KEY DECISIONS ===
${decisions.map((d) => `${d.title} (${d.consensus}) — ${d.summary}`).join('\n')}

=== ALERTS ===
${alerts.map((a) => `[${a.severity.toUpperCase()}] ${a.message}`).join('\n')}
`;
}
