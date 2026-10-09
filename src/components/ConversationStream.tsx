import { useState } from 'react';
import {
  FileText,
  ListTree,
  Upload,
  Flame,
  AlertTriangle,
  Info,
  CheckSquare,
  Gavel,
  AtSign,
  Clock,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import type { Message, ThreadTab, FilterType } from '../types';

interface ConversationStreamProps {
  messages: Message[];
  channelName: string;
  filters: Record<FilterType, boolean>;
}

const urgencyConfig = {
  high: {
    bar: 'bg-rose-500',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: Flame,
    label: 'High Urgency',
  },
  medium: {
    bar: 'bg-amber-500',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: AlertTriangle,
    label: 'Action Needed',
  },
  low: {
    bar: 'bg-blue-500',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: Info,
    label: 'FYI',
  },
};

export default function ConversationStream({
  messages,
  channelName,
  filters,
}: ConversationStreamProps) {
  const [tab, setTab] = useState<ThreadTab>('raw');
  const [dragOver, setDragOver] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    if (filters.mentions && !m.hasMention) return false;
    if (filters.deadlines && !m.hasDeadline) return false;
    if (filters.decisions && !m.hasDecision) return false;
    if (filters.actionItems && !m.hasActionItem) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-base-700 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('raw')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              tab === 'raw'
                ? 'bg-base-800 text-white'
                : 'text-base-400 hover:text-base-300'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Raw Thread
          </button>
          <button
            onClick={() => setTab('digest')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              tab === 'digest'
                ? 'bg-base-800 text-white'
                : 'text-base-400 hover:text-base-300'
            }`}
          >
            <ListTree className="h-3.5 w-3.5" />
            Structured Digest
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium text-base-500">
          <span>{filteredMessages.length} messages</span>
          <span className="h-3 w-px bg-base-700" />
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-accent-400" />
            AI-ranked
          </span>
        </div>
      </div>

      {/* Message List / Dropzone */}
      <div
        className="flex-1 overflow-y-auto"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-950/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-accent-500/50 bg-base-850 px-12 py-10">
              <Upload className="h-8 w-8 text-accent-400" />
              <p className="text-sm font-semibold text-white">Drop chat export here</p>
              <p className="text-xs text-base-400">JSON, TXT, or CSV — processed on-device</p>
            </div>
          </div>
        )}

        {tab === 'raw' ? (
          <div className="flex flex-col gap-0.5 p-3">
            {filteredMessages.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-base-500">
                No messages match the current filters
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <RawMessage
                  key={msg.id}
                  msg={msg}
                  hovered={hoveredMsg === msg.id}
                  onHover={setHoveredMsg}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3">
            {filteredMessages.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-base-500">
                No messages match the current filters
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <DigestMessage key={msg.id} msg={msg} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Upload Bar */}
      <div className="border-t border-base-700 px-4 py-2.5">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-base-600 py-2 text-xs font-medium text-base-400 transition-colors hover:border-accent-500/40 hover:text-accent-400">
          <Upload className="h-3.5 w-3.5" />
          Drop chat export or click to upload · JSON / TXT / CSV
        </button>
      </div>
    </div>
  );
}

function RawMessage({
  msg,
  hovered,
  onHover,
}: {
  msg: Message;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const u = urgencyConfig[msg.urgency];
  const UrgencyIcon = u.icon;

  return (
    <div
      onMouseEnter={() => onHover(msg.id)}
      onMouseLeave={() => onHover(null)}
      className={`group relative rounded-lg border p-3 transition-all ${
        hovered ? 'border-base-600 bg-base-800/60' : 'border-transparent hover:border-base-700 hover:bg-base-800/30'
      }`}
    >
      {/* Urgency bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${u.bar}`} />

      <div className="pl-2">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-base-500 to-base-600 text-[10px] font-bold text-white">
            {msg.avatar}
          </div>
          <span className="text-[13px] font-semibold text-white">{msg.author}</span>
          <span className="text-[11px] text-base-500">{msg.timestamp}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {/* Urgency Score */}
            <div className={`flex items-center gap-1 rounded-full ${u.bg} px-2 py-0.5`}>
              <UrgencyIcon className={`h-2.5 w-2.5 ${u.text}`} />
              <span className={`text-[10px] font-bold ${u.text}`}>{msg.urgencyScore}</span>
            </div>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-base-300">{msg.content}</p>

        {/* Tags + indicators */}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {msg.hasMention && (
            <span className="flex items-center gap-1 rounded bg-accent-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-accent-400">
              <AtSign className="h-2.5 w-2.5" /> Mention
            </span>
          )}
          {msg.hasDeadline && (
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
              <Clock className="h-2.5 w-2.5" /> Deadline
            </span>
          )}
          {msg.hasDecision && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
              <Gavel className="h-2.5 w-2.5" /> Decision
            </span>
          )}
          {msg.hasActionItem && (
            <span className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
              <CheckSquare className="h-2.5 w-2.5" /> Action Item
            </span>
          )}
          {msg.tags.map((tag) => (
            <span key={tag} className="rounded bg-base-700/50 px-1.5 py-0.5 text-[9px] font-medium text-base-400">
              #{tag}
            </span>
          ))}
          {msg.threadReplies && msg.threadReplies > 0 && (
            <span className="ml-auto text-[10px] font-medium text-base-500">
              {msg.threadReplies} replies
            </span>
          )}
        </div>

        {/* Urgency score bar */}
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-base-700/50">
          <div
            className={`h-full rounded-full ${u.bar} transition-all`}
            style={{ width: `${msg.urgencyScore}%` }}
          />
        </div>
      </div>

      {/* Hover context tooltip */}
      {hovered && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-base-600 bg-base-850 p-3 shadow-xl animate-fade-in">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-base-500">
            AI Context
          </div>
          <div className="flex items-center gap-2 text-[11px] text-base-400">
            <span>Urgency Score: <span className={`font-bold ${u.text}`}>{msg.urgencyScore}/100</span></span>
          </div>
          <div className="mt-1 text-[11px] text-base-400">
            Detected: {[
              msg.hasMention && 'Direct mention',
              msg.hasDeadline && 'Time-sensitive deadline',
              msg.hasDecision && 'Decision point',
              msg.hasActionItem && 'Actionable task',
            ].filter(Boolean).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

function DigestMessage({ msg }: { msg: Message }) {
  const u = urgencyConfig[msg.urgency];
  const UrgencyIcon = u.icon;

  return (
    <div className="rounded-lg border border-base-700 bg-base-800/40 p-3 transition-all hover-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded ${u.bg}`}>
            <UrgencyIcon className={`h-3 w-3 ${u.text}`} />
          </div>
          <span className="text-[12px] font-semibold text-white">{msg.author}</span>
          <span className="text-[10px] text-base-500">{msg.timestamp}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold ${u.text}`}>{msg.urgencyScore}</span>
          <div className="h-1 w-12 rounded-full bg-base-700">
            <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${msg.urgencyScore}%` }} />
          </div>
        </div>
      </div>

      {/* AI-generated digest */}
      <div className="rounded-md bg-base-900/50 p-2.5">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-accent-400">AI Digest</span>
        </div>
        <p className="text-[12px] leading-relaxed text-base-300">
          {generateDigest(msg)}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {msg.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-base-700/40 px-1.5 py-0.5 text-[9px] font-medium text-base-400">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function generateDigest(msg: Message): string {
  if (msg.hasActionItem && msg.hasDeadline) {
    return `Action required with deadline. ${msg.author} flagged this as requiring follow-up. Key topic: ${msg.tags.slice(0, 2).join(', ')}. Priority score indicates ${msg.urgency === 'high' ? 'immediate' : 'timely'} attention needed.`;
  }
  if (msg.hasDecision) {
    return `Decision recorded by ${msg.author}. Resolved discussion around ${msg.tags.slice(0, 2).join(', ')}. No further action needed unless revisited.`;
  }
  if (msg.hasMention) {
    return `${msg.author} directly mentioned team members. Topic: ${msg.tags.slice(0, 2).join(', ')}. Response may be expected.`;
  }
  return `Informational update from ${msg.author}. Topic: ${msg.tags.slice(0, 2).join(', ')}. No immediate action required.`;
}
