import {
  Hash,
  Users,
  AtSign,
  CalendarClock,
  CheckSquare,
  Gavel,
  ChevronDown,
  Bell,
} from 'lucide-react';
import type { Channel, FilterType } from '../types';

interface SidebarProps {
  channels: Channel[];
  activeChannel: string;
  onSelectChannel: (id: string) => void;
  filters: Record<FilterType, boolean>;
  onToggleFilter: (filter: FilterType) => void;
}

const urgencyConfig = {
  high: { color: 'bg-rose-500', text: 'text-rose-400', ring: 'ring-rose-500/20' },
  medium: { color: 'bg-amber-500', text: 'text-amber-400', ring: 'ring-amber-500/20' },
  low: { color: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/20' },
};

const filterConfig: { key: FilterType; label: string; icon: typeof AtSign }[] = [
  { key: 'mentions', label: 'Mentions', icon: AtSign },
  { key: 'deadlines', label: 'Deadlines', icon: CalendarClock },
  { key: 'decisions', label: 'Decisions Made', icon: Gavel },
  { key: 'actionItems', label: 'Action Items', icon: CheckSquare },
];

export default function Sidebar({
  channels,
  activeChannel,
  onSelectChannel,
  filters,
  onToggleFilter,
}: SidebarProps) {
  const channelList = channels.filter((c) => c.type === 'channel');
  const dmList = channels.filter((c) => c.type === 'dm');

  const totalUnread = channels.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-base-700 bg-base-900/50">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-base-700 px-3.5 py-3">
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-base-800">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-accent-400 to-accent-600 text-[10px] font-bold text-white">
            PL
          </div>
          <span className="text-[13px] font-semibold text-white">Product Launch</span>
          <ChevronDown className="h-3.5 w-3.5 text-base-500" />
        </button>
        <div className="relative">
          <Bell className="h-4 w-4 text-base-500" />
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-b border-base-700 px-2.5 py-3">
        <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-base-500">
          Quick Filters
        </div>
        <div className="flex flex-col gap-0.5">
          {filterConfig.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onToggleFilter(key)}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
                filters[key]
                  ? 'bg-accent-500/15 text-accent-400'
                  : 'text-base-400 hover:bg-base-800 hover:text-base-300'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${filters[key] ? 'text-accent-400' : 'text-base-500 group-hover:text-base-400'}`} />
              <span className="flex-1 text-left">{label}</span>
              {filters[key] && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-500">
            Channels
          </span>
          <ChevronDown className="h-3 w-3 text-base-600" />
        </div>
        <div className="flex flex-col gap-0.5">
          {channelList.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              active={activeChannel === channel.id}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))}
        </div>

        <div className="mb-1.5 mt-4 flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-500">
            Direct Messages
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {dmList.map((dm) => (
            <ChannelItem
              key={dm.id}
              channel={dm}
              active={activeChannel === dm.id}
              onClick={() => onSelectChannel(dm.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer: On-Device Status */}
      <div className="border-t border-base-700 px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-md bg-base-800/50 px-2 py-1.5">
          <Users className="h-3.5 w-3.5 text-base-500" />
          <span className="text-[11px] font-medium text-base-400">8 team members</span>
        </div>
      </div>
    </aside>
  );
}

function ChannelItem({
  channel,
  active,
  onClick,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
}) {
  const u = urgencyConfig[channel.urgency];
  const Icon = channel.type === 'dm' ? null : Hash;

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-all ${
        active
          ? 'bg-base-800 text-white'
          : 'text-base-400 hover:bg-base-800/50 hover:text-base-300'
      }`}
    >
      {Icon ? (
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-base-300' : 'text-base-600'}`} />
      ) : (
        <div className="h-4 w-4 flex-shrink-0 rounded-full bg-gradient-to-br from-base-500 to-base-600 text-[8px] font-bold text-white flex items-center justify-center">
          {channel.name.charAt(0)}
        </div>
      )}
      <span className={`flex-1 truncate text-[12px] font-medium ${active ? 'text-white' : ''}`}>
        {channel.type === 'dm' ? channel.name : channel.name}
      </span>
      {channel.unreadCount > 0 && (
        <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ring-1 ${u.color} ${u.ring} text-white`}>
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}
