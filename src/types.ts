export type UrgencyLevel = 'high' | 'medium' | 'low';

export type ChannelType = 'channel' | 'dm' | 'group';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  unreadCount: number;
  urgency: UrgencyLevel;
  lastActivity: string;
  participants?: string[];
  isDM?: boolean;
}

export interface Message {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  urgencyScore: number;
  urgency: UrgencyLevel;
  tags: string[];
  hasMention: boolean;
  hasDeadline: boolean;
  hasDecision: boolean;
  hasActionItem: boolean;
  threadReplies?: number;
  reactions?: { emoji: string; count: number }[];
}

export interface ActionItem {
  id: string;
  description: string;
  owner: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: UrgencyLevel;
  sourceMessageId: string;
  sourceSnippet: string;
}

export interface Decision {
  id: string;
  title: string;
  summary: string;
  participants: string[];
  resolvedAt: string;
  consensus: 'unanimous' | 'majority' | 'override';
  sourceMessageId: string;
}

export interface Alert {
  id: string;
  type: 'mention' | 'deadline' | 'risk' | 'escalation';
  message: string;
  severity: UrgencyLevel;
  channel: string;
  timestamp: string;
}

export interface PriorityItem {
  id: string;
  title: string;
  type: 'message' | 'task' | 'thread';
  urgent: boolean;
  important: boolean;
  score: number;
  owner?: string;
  deadline?: string;
}

export type ViewMode = 'dashboard' | 'matrix';
export type ThreadTab = 'raw' | 'digest';
export type FilterType = 'mentions' | 'deadlines' | 'decisions' | 'actionItems';
