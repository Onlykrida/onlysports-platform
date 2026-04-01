import { User, UserRole } from '@/types';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';
// Use Opus 4.6 for deep analysis, Sonnet 4.6 for quick tasks
const MODEL_SMART = 'claude-opus-4-6';
const MODEL_FAST = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

async function callClaude(
  messages: AIMessage[],
  systemPrompt: string,
  maxTokens: number = MAX_TOKENS,
  options?: { useSmartModel?: boolean; useThinking?: boolean },
): Promise<string> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'PASTE_YOUR_ROTATED_KEY_HERE') {
    throw new Error('Anthropic API key not configured');
  }

  const model = options?.useSmartModel ? MODEL_SMART : MODEL_FAST;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for smart model

  const body: Record<string, any> = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  };

  // Use adaptive thinking for complex analysis tasks (Opus/Sonnet 4.6)
  if (options?.useThinking) {
    body.thinking = { type: 'adaptive' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error (${response.status}): ${error}`);
    }

    const data: ClaudeResponse = await response.json();
    // Extract text blocks (skip thinking blocks)
    const textBlock = data.content.find((b) => b.type === 'text');
    return textBlock?.text || '';
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    throw error;
  }
}

// --- AI Feature Functions ---

export async function generateAthleteProfileSummary(profile: User): Promise<string> {
  const systemPrompt = `You are an AI sports talent scout for OnlyKrida, India's sports networking platform.
Write compelling, concise athlete summaries that scouts would find useful.
Keep it to 3-4 sentences. Highlight standout qualities. Be encouraging but honest.
Never use demotivating language. Focus on potential and growth.`;

  const profileData = `
Name: ${profile.name}
Sport: ${profile.sport || 'Not specified'}
Position: ${profile.position || 'Not specified'}
Location: ${profile.location || 'Not specified'}
Bio: ${profile.bio || 'No bio'}
Achievements: ${profile.achievements?.map((a) => a.title).join(', ') || 'None listed yet'}
Followers: ${profile.followersCount || 0}
Stats: ${profile.stats ? JSON.stringify(profile.stats) : 'Not available'}
Role-specific: ${profile.roleSpecificData ? JSON.stringify(profile.roleSpecificData) : 'None'}`;

  return callClaude(
    [{ role: 'user', content: `Write a scout-readable summary for this athlete:\n${profileData}` }],
    systemPrompt,
    300,
    { useSmartModel: false }, // Fast for summaries
  );
}

export async function getSmartScoutRecommendations(
  scoutPreferences: {
    sport?: string;
    positions?: string[];
    regions?: string[];
    lookingFor?: string;
  },
  athletes: User[],
): Promise<Array<{ athleteId: string; fitScore: number; reasoning: string }>> {
  const systemPrompt = `You are OnlyKrida's AI scouting engine. Analyze athletes against scout preferences.
Return a JSON array of recommendations sorted by fit score (0-100).
Each entry: { "athleteId": "id", "fitScore": number, "reasoning": "1-2 sentence explanation" }
Be specific about WHY each athlete matches. Consider sport, position, location, stats, and potential.
Return ONLY valid JSON, no markdown.`;

  const athleteList = athletes.slice(0, 20).map((a) => ({
    id: a.id,
    name: a.name,
    sport: a.sport,
    position: a.position,
    location: a.location,
    bio: a.bio,
    stats: a.stats,
    achievements: a.achievements?.map((ac) => ac.title),
    followersCount: a.followersCount,
  }));

  const result = await callClaude(
    [
      {
        role: 'user',
        content: `Scout is looking for:
Sport: ${scoutPreferences.sport || 'Any'}
Positions: ${scoutPreferences.positions?.join(', ') || 'Any'}
Regions: ${scoutPreferences.regions?.join(', ') || 'Any'}
Looking for: ${scoutPreferences.lookingFor || 'General talent'}

Available athletes:
${JSON.stringify(athleteList, null, 2)}

Rank these athletes by fit. Return JSON array only.`,
      },
    ],
    systemPrompt,
    1500,
    { useSmartModel: true, useThinking: true }, // Deep analysis for scouting
  );

  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

export async function generateProfileSuggestions(
  profile: User,
): Promise<Array<{ field: string; suggestion: string; impact: string }>> {
  const systemPrompt = `You are OnlyKrida's AI profile coach. Help athletes optimize their profiles to get noticed by scouts.
Return a JSON array of suggestions. Each: { "field": "fieldName", "suggestion": "actionable tip", "impact": "high/medium/low" }
Be encouraging and specific. Never demotivate. Frame everything as growth opportunity.
Return ONLY valid JSON, no markdown. Max 5 suggestions.`;

  const completeness = {
    hasAvatar: !!profile.avatar,
    hasBio: !!profile.bio && profile.bio.length > 20,
    hasSport: !!profile.sport,
    hasPosition: !!profile.position,
    hasLocation: !!profile.location,
    hasAchievements: !!profile.achievements && profile.achievements.length > 0,
    hasStats: !!profile.stats && Object.keys(profile.stats).length > 0,
  };

  const result = await callClaude(
    [
      {
        role: 'user',
        content: `Athlete profile to optimize:
Name: ${profile.name}
Role: ${profile.role}
Sport: ${profile.sport || 'Missing'}
Position: ${profile.position || 'Missing'}
Location: ${profile.location || 'Missing'}
Bio: ${profile.bio || 'Missing'}
Avatar: ${completeness.hasAvatar ? 'Yes' : 'No'}
Achievements: ${profile.achievements?.length || 0} listed
Stats: ${completeness.hasStats ? 'Has stats' : 'No stats'}

Profile completeness: ${JSON.stringify(completeness)}

Give specific suggestions to make this profile stand out to scouts.`,
      },
    ],
    systemPrompt,
    800,
    { useSmartModel: false }, // Fast for suggestions
  );

  try {
    return JSON.parse(result);
  } catch {
    return [
      {
        field: 'bio',
        suggestion: 'Add a compelling bio that highlights your journey and goals',
        impact: 'high',
      },
      {
        field: 'achievements',
        suggestion: 'List your top 3 achievements — even small wins count',
        impact: 'high',
      },
      {
        field: 'avatar',
        suggestion: 'Upload a clear action photo showing you in your sport',
        impact: 'medium',
      },
    ];
  }
}

export async function generateOpportunityMatch(
  profile: User,
  opportunities: Array<{
    id: string;
    title: string;
    category: string;
    sport?: string;
    location?: string;
    requirements?: string;
    description?: string;
  }>,
): Promise<Array<{ opportunityId: string; matchScore: number; reasoning: string }>> {
  const systemPrompt = `You are OnlyKrida's opportunity matching AI. Match athletes to the best opportunities.
Return a JSON array sorted by match score (0-100).
Each: { "opportunityId": "id", "matchScore": number, "reasoning": "why this is a good fit" }
Consider sport, location, skill level, and career stage. Be encouraging.
Return ONLY valid JSON. Max 10 results.`;

  const result = await callClaude(
    [
      {
        role: 'user',
        content: `Athlete:
Name: ${profile.name}, Sport: ${profile.sport || 'Not specified'}, Position: ${profile.position || 'Any'}
Location: ${profile.location || 'Not specified'}, Bio: ${profile.bio || 'None'}

Opportunities:
${JSON.stringify(opportunities.slice(0, 15), null, 2)}

Match this athlete to the best opportunities.`,
      },
    ],
    systemPrompt,
    1000,
    { useSmartModel: true, useThinking: true }, // Deep analysis for matching
  );

  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function chatWithAI(
  messages: ChatMessage[],
  userContext: { name: string; role: UserRole; sport?: string; location?: string },
): Promise<string> {
  const systemPrompt = `You are Krida AI, the smart assistant inside OnlyKrida — India's sports networking platform.
You help ${userContext.role}s achieve their goals:
- Athletes: improve profiles, find opportunities, understand their stats, get training advice
- Scouts: find talent, understand athlete metrics, build shortlists
- Coaches: manage teams, find athletes, post opportunities
- Teams: recruit talent, manage roster
- Fans: discover athletes, follow sports

User: ${userContext.name} (${userContext.role})${userContext.sport ? `, Sport: ${userContext.sport}` : ''}${userContext.location ? `, Location: ${userContext.location}` : ''}

Be helpful, concise, and encouraging. Use sports terminology naturally.
Keep responses under 150 words unless the user asks for detail.
Never be demotivating. Frame everything as growth and opportunity.`;

  const apiMessages: AIMessage[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return callClaude(apiMessages, systemPrompt, 500, { useSmartModel: false });
}

export function isAIConfigured(): boolean {
  return !!ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'PASTE_YOUR_ROTATED_KEY_HERE';
}
