import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/hooks/auth-context';
import {
  ChatMessage,
  chatWithAI,
  generateAthleteProfileSummary,
  generateProfileSuggestions,
  generateOpportunityMatch,
  getSmartScoutRecommendations,
  isAIConfigured,
} from '@/services/ai';

interface ProfileSuggestion {
  field: string;
  suggestion: string;
  impact: string;
}

interface OpportunityMatchResult {
  opportunityId: string;
  matchScore: number;
  reasoning: string;
}

interface ScoutRecommendation {
  athleteId: string;
  fitScore: number;
  reasoning: string;
}

interface AIState {
  // Chat
  aiMessages: ChatMessage[];
  sendAIMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  isChatLoading: boolean;

  // Profile
  profileSummary: string | null;
  generateSummary: () => Promise<void>;
  isSummaryLoading: boolean;

  // Suggestions
  profileTips: ProfileSuggestion[];
  getProfileTips: () => Promise<void>;
  isTipsLoading: boolean;

  // Opportunity matching
  opportunityMatches: OpportunityMatchResult[];
  matchOpportunities: (opportunities: any[]) => Promise<void>;
  isMatchingLoading: boolean;

  // Scout recommendations
  scoutRecommendations: ScoutRecommendation[];
  getRecommendations: (preferences: any, athletes: any[]) => Promise<void>;
  isRecommendationsLoading: boolean;

  // Status
  isConfigured: boolean;
}

const AI_DEFAULTS: AIState = {
  aiMessages: [],
  sendAIMessage: async () => {},
  clearChat: () => {},
  isChatLoading: false,
  profileSummary: null,
  generateSummary: async () => {},
  isSummaryLoading: false,
  profileTips: [],
  getProfileTips: async () => {},
  isTipsLoading: false,
  opportunityMatches: [],
  matchOpportunities: async () => {},
  isMatchingLoading: false,
  scoutRecommendations: [],
  getRecommendations: async () => {},
  isRecommendationsLoading: false,
  isConfigured: false,
};

const [AIProvider, _useAI] = createContextHook<AIState>(() => {
  const { user } = useAuth();

  // Chat state
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Profile summary
  const [profileSummary, setProfileSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Profile tips
  const [profileTips, setProfileTips] = useState<ProfileSuggestion[]>([]);
  const [isTipsLoading, setIsTipsLoading] = useState(false);

  // Opportunity matching
  const [opportunityMatches, setOpportunityMatches] = useState<OpportunityMatchResult[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Scout recommendations
  const [scoutRecommendations, setScoutRecommendations] = useState<ScoutRecommendation[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);

  const messageIdCounter = useRef(0);

  // Use a ref to track latest messages so the callback doesn't go stale
  const aiMessagesRef = useRef<ChatMessage[]>(aiMessages);
  aiMessagesRef.current = aiMessages;

  const isChatLoadingRef = useRef(false);
  isChatLoadingRef.current = isChatLoading;

  const sendAIMessage = useCallback(
    async (message: string) => {
      if (!user || isChatLoadingRef.current) return;

      const userMsg: ChatMessage = {
        id: `user-${++messageIdCounter.current}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      const updatedMessages = [...aiMessagesRef.current, userMsg];
      setAiMessages(updatedMessages);
      setIsChatLoading(true);

      try {
        const response = await chatWithAI(updatedMessages, {
          name: user.name,
          role: user.role,
          sport: user.sport,
          location: user.location,
        });

        const aiMsg: ChatMessage = {
          id: `ai-${++messageIdCounter.current}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        setAiMessages((prev) => [...prev, aiMsg]);
      } catch (error: any) {
        const errorMsg: ChatMessage = {
          id: `ai-${++messageIdCounter.current}`,
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Please try again.',
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [user],
  );

  const clearChat = useCallback(() => {
    setAiMessages([]);
  }, []);

  const generateSummary = useCallback(async () => {
    if (!user || isSummaryLoading) return;
    setIsSummaryLoading(true);
    try {
      const summary = await generateAthleteProfileSummary(user);
      setProfileSummary(summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [user, isSummaryLoading]);

  const getProfileTips = useCallback(async () => {
    if (!user || isTipsLoading) return;
    setIsTipsLoading(true);
    try {
      const tips = await generateProfileSuggestions(user);
      setProfileTips(tips);
    } catch (error) {
      console.error('Failed to get profile tips:', error);
    } finally {
      setIsTipsLoading(false);
    }
  }, [user, isTipsLoading]);

  const matchOpportunities = useCallback(
    async (opportunities: any[]) => {
      if (!user || isMatchingLoading) return;
      setIsMatchingLoading(true);
      try {
        const matches = await generateOpportunityMatch(user, opportunities);
        setOpportunityMatches(matches);
      } catch (error) {
        console.error('Failed to match opportunities:', error);
      } finally {
        setIsMatchingLoading(false);
      }
    },
    [user, isMatchingLoading],
  );

  const getRecommendations = useCallback(
    async (preferences: any, athletes: any[]) => {
      if (!user || isRecommendationsLoading) return;
      setIsRecommendationsLoading(true);
      try {
        const recs = await getSmartScoutRecommendations(preferences, athletes);
        setScoutRecommendations(recs);
      } catch (error) {
        console.error('Failed to get recommendations:', error);
      } finally {
        setIsRecommendationsLoading(false);
      }
    },
    [user, isRecommendationsLoading],
  );

  return {
    aiMessages,
    sendAIMessage,
    clearChat,
    isChatLoading,
    profileSummary,
    generateSummary,
    isSummaryLoading,
    profileTips,
    getProfileTips,
    isTipsLoading,
    opportunityMatches,
    matchOpportunities,
    isMatchingLoading,
    scoutRecommendations,
    getRecommendations,
    isRecommendationsLoading,
    isConfigured: isAIConfigured(),
  };
});

export { AIProvider };
export const useAI = () => _useAI() ?? AI_DEFAULTS;
