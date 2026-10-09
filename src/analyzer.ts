import type {
  Message,
  ActionItem,
  Decision,
  Alert,
  PriorityItem,
  UrgencyLevel,
} from './types';

export interface AnalysisResult {
  messages: Message[];
  actionItems: ActionItem[];
  decisions: Decision[];
  alerts: Alert[];
  priorityItems: PriorityItem[];
  execSummary: string[];
  participants: string[];
  channelName: string;
}

interface ParsedLine {
  author: string;
  timestamp: string;
  content: string;
}

const HIGH_URGENCY_KEYWORDS = [
  'p0', 'p1', 'urgent', 'critical', 'asap', 'production', 'down', 'outage',
  'broken', 'bug', 'hotfix', 'blocking', 'emergency', 'severe', 'crash',
  '500 error', '404', 'failing', 'incident', 'security', 'breach',
  'deadline', 'overdue', 'missed', 'escalat',
];

const MEDIUM_URGENCY_KEYWORDS = [
  'should', 'need to', 'must', 'important', 'review', 'approve',
  'today', 'tomorrow', 'this week', 'eod', 'soon', 'follow up',
  'reminder', 'please', 'required', 'pending', 'waiting',
];

const DEADLINE_PATTERNS = [
  /\bby\s+(?:end of )?(?:today|tomorrow|tonight|eod|friday|monday|tuesday|wednesday|thursday|saturday|sunday)/gi,
  /\b(?:today|tomorrow)\s+(?:at|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi,
  /\bdue\s+(?:by|on|today|tomorrow)/gi,
  /\bdeadline\b/gi,
  /\bend of (?:day|week|sprint|quarter)/gi,
  /\bnext (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week)/gi,
  /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,
  /\bthis (?:morning|afternoon|evening|week)\b/gi,
];

const DECISION_KEYWORDS = [
  'decided', 'decision', 'agreed', 'consensus', 'resolved',
  'going with', "we'll use", 'we are going', 'final call',
  'locked in', 'concluded', 'approved', 'confirmed that',
  'the plan is', 'we will go with',
];

const ACTION_KEYWORDS = [
  'todo', 'action item', 'will ', 'need to', 'needs to', 'should ',
  'must ', 'assigned to', 'responsible for', 'task:',
  'can you', 'could you', 'please ', "i'll ", 'i will',
  'let\'s ', 'make sure', 'ensure', 'follow up',
  'create', 'update', 'deploy', 'fix', 'investigate',
  'prepare', 'send', 'share', 'review',
];

const RISK_KEYWORDS = [
  'risk', 'concern', 'warning', 'careful', 'watch out',
  'might break', 'could fail', 'danger', 'issue', 'problem',
  'blocking', 'blocker', 'dependent on',
];

function parseLines(rawText: string): ParsedLine[] {
  const lines = rawText.split('\n').filter((l) => l.trim());
  const parsed: ParsedLine[] = [];

  // Try JSON parse first (Slack/Discord export)
  try {
    const json = JSON.parse(rawText);
    if (Array.isArray(json)) {
      for (const item of json) {
        const author = item.user || item.username || item.author || 'Unknown';
        const ts = item.ts
          ? new Date(parseFloat(item.ts) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : item.timestamp || item.time || '';
        const content = item.text || item.content || item.message || '';
        if (content.trim()) {
          parsed.push({ author, timestamp: ts, content: stripHtml(content) });
        }
      }
      return parsed;
    }
    if (json.messages && Array.isArray(json.messages)) {
      for (const item of json.messages) {
        const author = item.user || item.username || item.author || 'Unknown';
        const ts = item.ts
          ? new Date(parseFloat(item.ts) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : item.timestamp || '';
        const content = item.text || item.content || '';
        if (content.trim()) {
          parsed.push({ author, timestamp: ts, content: stripHtml(content) });
        }
      }
      return parsed;
    }
  } catch {
    // Not JSON, continue to text parsing
  }

  // Text-based parsing — detect common chat export formats
  // Format 1: [9:41 AM] Author: message
  // Format 2: Author [9:41 AM]: message
  // Format 3: Author: message (no timestamp)
  // Format 4: <Author> message (IRC/Discord style)

  const patterns = [
    /^\[(\d{1,2}:\d{2}\s*(?:AM|PM)?)\]\s*(.+?):\s*(.+)$/,
    /^(.+?)\s*\[(\d{1,2}:\d{2}\s*(?:AM|PM)?)\]:\s*(.+)$/,
    /^<@?\w+>\s*(.*)$/,
    /^(.+?):\s+(.+)$/,
    /^([^:]+):\s*(.+)$/,
  ];

  let currentAuthor = '';
  let currentTimestamp = '';
  let currentContent = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;

    // Pattern 1: [timestamp] Author: message
    const m1 = trimmed.match(/^\[(\d{1,2}:\d{2}\s*(?:AM|PM)?)\]\s*(.+?):\s*(.+)$/i);
    if (m1) {
      if (currentContent) {
        parsed.push({ author: currentAuthor, timestamp: currentTimestamp, content: currentContent.trim() });
      }
      currentTimestamp = m1[1];
      currentAuthor = m1[2].trim();
      currentContent = m1[3].trim();
      matched = true;
    }

    // Pattern 2: Author [timestamp]: message
    if (!matched) {
      const m2 = trimmed.match(/^(.+?)\s*\[(\d{1,2}:\d{2}\s*(?:AM|PM)?)\]:\s*(.+)$/i);
      if (m2) {
        if (currentContent) {
          parsed.push({ author: currentAuthor, timestamp: currentTimestamp, content: currentContent.trim() });
        }
        currentAuthor = m2[1].trim();
        currentTimestamp = m2[2];
        currentContent = m2[3].trim();
        matched = true;
      }
    }

    // Pattern 3: Author: message (with colon)
    if (!matched) {
      const m3 = trimmed.match(/^([^:]{2,40}):\s+(.+)$/);
      if (m3 && !m3[1].includes('\n') && m3[1].length < 40) {
        // Heuristic: author names are typically short and don't contain certain chars
        const potentialAuthor = m3[1].trim();
        if (/^[A-Za-z][A-Za-z\s._-]*$/.test(potentialAuthor) && !isUrlLine(trimmed)) {
          if (currentContent) {
            parsed.push({ author: currentAuthor, timestamp: currentTimestamp, content: currentContent.trim() });
          }
          currentAuthor = potentialAuthor;
          currentTimestamp = '';
          currentContent = m3[2].trim();
          matched = true;
        }
      }
    }

    // Pattern 4: <Author> message (IRC/Discord)
    if (!matched) {
      const m4 = trimmed.match(/^<@?([^>]+)>\s*(.+)$/);
      if (m4) {
        if (currentContent) {
          parsed.push({ author: currentAuthor, timestamp: currentTimestamp, content: currentContent.trim() });
        }
        currentAuthor = m4[1].trim();
        currentTimestamp = '';
        currentContent = m4[2].trim();
        matched = true;
      }
    }

    // Continuation of previous message
    if (!matched) {
      currentContent += ' ' + trimmed;
    }
  }

  // Push last message
  if (currentContent) {
    parsed.push({ author: currentAuthor, timestamp: currentTimestamp, content: currentContent.trim() });
  }

  return parsed;
}

function stripHtml(text: string): string {
  return text
    .replace(/<@U\d+|[^>]+>/g, (match) => {
      const id = match.replace(/<@|>/g, '');
      return `@${id}`;
    })
    .replace(/<#[^>]+>/g, (match) => {
      const id = match.replace(/<#|>/g, '');
      return `#${id}`;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function isUrlLine(line: string): boolean {
  return /^https?:\/\//i.test(line.trim());
}

function scoreUrgency(content: string): { score: number; level: UrgencyLevel } {
  const lower = content.toLowerCase();
  let score = 20;

  for (const kw of HIGH_URGENCY_KEYWORDS) {
    if (lower.includes(kw)) score += 18;
  }
  for (const kw of MEDIUM_URGENCY_KEYWORDS) {
    if (lower.includes(kw)) score += 8;
  }

  // Exclamation marks add urgency
  const exclaims = (content.match(/!/g) || []).length;
  score += Math.min(exclaims * 3, 12);

  // ALL CAPS words add urgency
  const capsWords = (content.match(/\b[A-Z]{3,}\b/g) || []).length;
  score += Math.min(capsWords * 4, 12);

  // Mentions add urgency
  const mentions = (content.match(/@\w+/g) || []).length;
  score += Math.min(mentions * 5, 15);

  score = Math.min(score, 100);

  let level: UrgencyLevel = 'low';
  if (score >= 70) level = 'high';
  else if (score >= 45) level = 'medium';

  return { score, level };
}

function detectMentions(content: string): boolean {
  return /@\w+/.test(content);
}

function detectDeadline(content: string): boolean {
  for (const pattern of DEADLINE_PATTERNS) {
    if (pattern.test(content)) return true;
  }
  return false;
}

function extractDeadline(content: string): string {
  for (const pattern of DEADLINE_PATTERNS) {
    const match = content.match(pattern);
    if (match) return match[0].replace(/\bby\s+/i, '').trim();
  }
  return 'No specific deadline';
}

function detectDecision(content: string): boolean {
  const lower = content.toLowerCase();
  return DECISION_KEYWORDS.some((kw) => lower.includes(kw));
}

function detectActionItem(content: string): boolean {
  const lower = content.toLowerCase();
  return ACTION_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractOwner(content: string, author: string): string {
  // Look for @mentions as potential owners
  const mentions = content.match(/@(\w+)/g);
  if (mentions && mentions.length > 0) {
    return mentions[0].replace('@', '');
  }
  // If the message contains "I'll" or "I will", the author is the owner
  if (/\b(?:i'll|i will|i'm going to)\b/i.test(content)) {
    return author;
  }
  return author;
}

function extractTags(content: string): string[] {
  const tags: string[] = [];
  // Hashtags
  const hashtags = content.match(/#(\w+)/g);
  if (hashtags) {
    tags.push(...hashtags.map((t) => t.replace('#', '')));
  }
  // Key topic keywords
  const lower = content.toLowerCase();
  const topicKeywords: { kw: string; tag: string }[] = [
    { kw: 'stripe', tag: 'stripe' },
    { kw: 'deploy', tag: 'deployment' },
    { kw: 'production', tag: 'production' },
    { kw: 'bug', tag: 'bug' },
    { kw: 'launch', tag: 'launch' },
    { kw: 'design', tag: 'design' },
    { kw: 'api', tag: 'api' },
    { kw: 'test', tag: 'testing' },
    { kw: 'security', tag: 'security' },
    { kw: 'database', tag: 'database' },
    { kw: 'migration', tag: 'migration' },
    { kw: 'review', tag: 'review' },
    { kw: 'marketing', tag: 'marketing' },
    { kw: 'legal', tag: 'legal' },
    { kw: 'meeting', tag: 'meeting' },
    { kw: 'rate limit', tag: 'rate-limiter' },
    { kw: 'hotfix', tag: 'hotfix' },
    { kw: 'ci', tag: 'ci' },
    { kw: 'rollback', tag: 'rollback' },
  ];
  for (const { kw, tag } of topicKeywords) {
    if (lower.includes(kw) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags.slice(0, 6);
}

function getInitials(name: string): string {
  const parts = name.replace(/[@<>]/g, '').trim().split(/[\s._-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.replace(/[@<>]/g, '').substring(0, 2).toUpperCase();
}

function generateExecSummary(
  messages: Message[],
  actionItems: ActionItem[],
  decisions: Decision[],
  alerts: Alert[],
): string[] {
  const summary: string[] = [];

  // Summary point 1: High urgency overview
  const highUrgency = messages.filter((m) => m.urgency === 'high');
  if (highUrgency.length > 0) {
    const topMsg = highUrgency[0];
    const topicTags = topMsg.tags.slice(0, 2).join(', ');
    summary.push(
      `${highUrgency.length} high-priority message${highUrgency.length > 1 ? 's' : ''} detected. Top item from ${topMsg.author} (urgency ${topMsg.urgencyScore}/100) regarding ${topicTags || 'a critical topic'}. This requires immediate attention.`,
    );
  } else {
    const medUrgency = messages.filter((m) => m.urgency === 'medium');
    if (medUrgency.length > 0) {
      summary.push(`${medUrgency.length} messages need follow-up. No critical emergencies detected, but several items have approaching deadlines or action items.`);
    } else {
      summary.push(`${messages.length} messages analyzed. No urgent items detected — this conversation appears to be informational.`);
    }
  }

  // Summary point 2: Action items overview
  const pendingActions = actionItems.filter((a) => a.status !== 'completed');
  if (pendingActions.length > 0) {
    const owners = [...new Set(pendingActions.map((a) => a.owner))];
    const withDeadlines = pendingActions.filter((a) => a.deadline !== 'No specific deadline');
    let point = `${pendingActions.length} action item${pendingActions.length > 1 ? 's' : ''} extracted, assigned to ${owners.slice(0, 4).join(', ')}${owners.length > 4 ? ` and ${owners.length - 4} others` : ''}.`;
    if (withDeadlines.length > 0) {
      point += ` ${withDeadlines.length} have specific deadlines that should be tracked.`;
    }
    summary.push(point);
  } else {
    summary.push('No outstanding action items found in this conversation.');
  }

  // Summary point 3: Decisions overview
  if (decisions.length > 0) {
    const decisionTitles = decisions.slice(0, 3).map((d) => d.title);
    summary.push(
      `${decisions.length} decision${decisions.length > 1 ? 's were' : ' was'} made: ${decisionTitles.join('; ')}. These are resolved and require no further input unless revisited.`,
    );
  } else {
    const mentions = messages.filter((m) => m.hasMention);
    if (mentions.length > 0) {
      summary.push(`${mentions.length} direct mention${mentions.length > 1 ? 's' : ''} found — check if any require your response.`);
    } else {
      summary.push('No formal decisions or direct mentions detected in this conversation.');
    }
  }

  return summary;
}

export function analyzeConversation(rawText: string): AnalysisResult {
  const parsedLines = parseLines(rawText);
  const messages: Message[] = [];
  const actionItems: ActionItem[] = [];
  const decisions: Decision[] = [];
  const alerts: Alert[] = [];
  const participantsSet = new Set<string>();

  parsedLines.forEach((line, idx) => {
    participantsSet.add(line.author);
    const { score, level } = scoreUrgency(line.content);
    const hasMention = detectMentions(line.content);
    const hasDeadline = detectDeadline(line.content);
    const hasDecision = detectDecision(line.content);
    const hasActionItem = detectActionItem(line.content);
    const tags = extractTags(line.content);
    const mentions = (line.content.match(/@(\w+)/g) || []).map((m) => m.replace('@', ''));

    const msg: Message = {
      id: `m${idx}`,
      author: line.author,
      avatar: getInitials(line.author),
      timestamp: line.timestamp || '',
      content: line.content,
      urgencyScore: score,
      urgency: level,
      tags,
      hasMention,
      hasDeadline,
      hasDecision,
      hasActionItem,
    };
    messages.push(msg);

    // Extract action items
    if (hasActionItem && (level === 'high' || level === 'medium' || hasDeadline)) {
      const owner = extractOwner(line.content, line.author);
      const deadline = hasDeadline ? extractDeadline(line.content) : 'No specific deadline';
      // Create a concise description from the message
      let description = line.content.length > 120
        ? line.content.substring(0, 117) + '...'
        : line.content;
      // Clean up prefixes
      description = description.replace(/^(?:i'll|i will|can you|could you|please|need to|should|let's)\s+/i, (match) => {
        return match.charAt(0).toUpperCase() + match.slice(1);
      });

      actionItems.push({
        id: `a${idx}`,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        owner,
        deadline,
        status: level === 'high' ? 'pending' : 'pending',
        priority: level,
        sourceMessageId: msg.id,
        sourceSnippet: line.content.substring(0, 80),
      });
    }

    // Extract decisions
    if (hasDecision) {
      // Try to extract a title
      let title = line.content.length > 60
        ? line.content.substring(0, 57) + '...'
        : line.content;
      const lower = line.content.toLowerCase();
      for (const kw of DECISION_KEYWORDS) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          const after = line.content.substring(idx + kw.length).replace(/^[:\s]+/, '');
          if (after.length > 5) {
            title = after.length > 60 ? after.substring(0, 57) + '...' : after;
          }
          break;
        }
      }
      title = title.charAt(0).toUpperCase() + title.slice(1);

      // Detect consensus type
      let consensus: Decision['consensus'] = 'majority';
      if (/unanimous|everyone agrees?|all agreed|no objections/i.test(line.content)) {
        consensus = 'unanimous';
      } else if (/override|lead call|i'm calling|final call|i'll decide/i.test(line.content)) {
        consensus = 'override';
      }

      // Find participants (author + mentioned people)
      const decisionParticipants = [line.author, ...mentions].slice(0, 4);

      decisions.push({
        id: `d${idx}`,
        title,
        summary: line.content.length > 200
          ? line.content.substring(0, 197) + '...'
          : line.content,
        participants: [...new Set(decisionParticipants)],
        resolvedAt: line.timestamp || 'this conversation',
        consensus,
        sourceMessageId: msg.id,
      });
    }

    // Generate alerts for mentions and deadlines with high urgency
    if (hasMention && level === 'high') {
      const mentionNames = mentions.slice(0, 2).map((m) => `@${m}`).join(', ');
      alerts.push({
        id: `al${idx}`,
        type: 'mention',
        message: `${mentionNames} — ${line.author} tagged you in a high-priority message: "${line.content.substring(0, 80)}${line.content.length > 80 ? '...' : ''}"`,
        severity: 'high',
        channel: 'conversation',
        timestamp: line.timestamp || '',
      });
    }

    if (hasDeadline && level === 'high') {
      const deadline = extractDeadline(line.content);
      alerts.push({
        id: `ald${idx}`,
        type: 'deadline',
        message: `Upcoming deadline detected (${deadline}): "${line.content.substring(0, 80)}${line.content.length > 80 ? '...' : ''}"`,
        severity: level,
        channel: 'conversation',
        timestamp: line.timestamp || '',
      });
    }

    // Risk alerts
    const lowerContent = line.content.toLowerCase();
    if (RISK_KEYWORDS.some((kw) => lowerContent.includes(kw)) && level !== 'low') {
      alerts.push({
        id: `alr${idx}`,
        type: 'risk',
        message: `Potential risk flagged by ${line.author}: "${line.content.substring(0, 80)}${line.content.length > 80 ? '...' : ''}"`,
        severity: level,
        channel: 'conversation',
        timestamp: line.timestamp || '',
      });
    }
  });

  // Deduplicate alerts (keep only unique ones, limit to 6)
  const uniqueAlerts = alerts.slice(0, 6);

  // Generate priority items
  const priorityItems: PriorityItem[] = [];

  // Add high-urgency messages as priority items
  messages
    .filter((m) => m.urgency !== 'low' || m.hasDeadline || m.hasDecision)
    .forEach((msg) => {
      const urgent = msg.urgency === 'high';
      const important = msg.hasActionItem || msg.hasDecision || msg.hasDeadline;

      let title = msg.content.length > 70
        ? msg.content.substring(0, 67) + '...'
        : msg.content;

      priorityItems.push({
        id: `p${msg.id}`,
        title: `${msg.author}: ${title}`,
        type: msg.hasActionItem ? 'task' : msg.hasDecision ? 'message' : 'message',
        urgent,
        important,
        score: msg.urgencyScore,
        owner: msg.hasMention ? (msg.content.match(/@(\w+)/) || [])[1] : undefined,
        deadline: msg.hasDeadline ? extractDeadline(msg.content) : undefined,
      });
    });

  const execSummary = generateExecSummary(messages, actionItems, decisions, uniqueAlerts);

  return {
    messages,
    actionItems,
    decisions,
    alerts: uniqueAlerts,
    priorityItems,
    execSummary,
    participants: [...participantsSet],
    channelName: 'Imported Conversation',
  };
}

// Sample conversation for the "try sample" button
export const SAMPLE_CONVERSATION = `[9:41 AM] Sarah Chen: We just hit a P0 bug — checkout is returning 500 errors for Stripe payments. Affecting ~40% of users in production right now. I've rolled back the last deploy but the root cause is still unidentified.
[9:43 AM] Alex Rivera: @Sarah I'm on it. Looking at the Stripe webhook logs now. The issue seems to be in the payment intent creation flow. I'll have a hotfix PR up within 30 minutes.
[9:45 AM] Jordan Kim: Decision: We're going to pin the Stripe SDK to v14.2.1 for now and defer the v15 upgrade to next sprint. The breaking change in v15 isn't documented well enough. Everyone agree?
[9:47 AM] Priya Sharma: Confirmed, pinning to v14.2.1 makes sense. I've already updated the CI pipeline to lock that version. @Alex once your hotfix is deployed, I'll run the full e2e suite against staging.
[9:52 AM] Marcus Lee: FYI for the launch team — the marketing landing page copy needs final approval by EOD today. Legal is waiting on the privacy policy section. @Sarah can you review the compliance wording before 3 PM? The press embargo lifts tomorrow at 9 AM.
[9:58 AM] Emily Watson: Quick update on the design system migration — we've completed 70% of the component conversions. The remaining 30% will be done by Thursday EOD. No blockers so far.
[10:02 AM] David Okafor: Heads up — I noticed the rate limiter on the API gateway is rejecting legitimate traffic from our mobile app. The token bucket config is too aggressive. I'm proposing we increase the burst limit from 10 to 50 req/s. This is blocking the mobile team's beta testing.
[10:05 AM] Sarah Chen: @David go ahead and increase to 50 req/s. I'll approve the config PR as soon as you open it. Also, can you add monitoring alerts so we know if we're hitting the new threshold? We don't want to discover this in production again.
[10:12 AM] Alex Rivera: Hotfix deployed to production. Checkout is back online — Stripe payments processing normally. Root cause was the v15 SDK expecting a payment_method_types array instead of a string. @Priya staging e2e is ready when you are.
[10:15 AM] Marcus Lee: Reminder: The launch readiness review is scheduled for 2 PM today. Everyone needs to bring their team's status update. Key items: feature freeze confirmation, QA sign-off, and final go/no-go vote.
[10:20 AM] Jordan Kim: Decision: We're going with Postgres-based job queue over Redis/Sidekiq for the notification service. The team voted 5-1 in favor. We'll use SKIP LOCKED for concurrent job claiming.
[10:24 AM] Priya Sharma: E2e suite passed — 247 tests, 0 failures. The rollback is clean. I've also added a new test case specifically for the Stripe SDK version compatibility. Good work everyone.`;
