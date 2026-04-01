import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { SearchResult } from '@/types';
import { supabase, isSupabaseConfigured } from '@/constants/supabase';

interface SearchState {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  recentSearches: string[];
  setSearchQuery: (query: string) => void;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const [SearchProvider, useSearch] = createContextHook<SearchState>(() => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !isSupabaseConfigured) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const sanitized = query.replace(/[,%()\\]/g, '');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, avatar, sport, verified')
        .or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,sport.ilike.%${sanitized}%`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        return;
      }

      const results: SearchResult[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        type: 'user' as const,
        name: profile.name,
        avatar: profile.avatar,
        subtitle: `${profile.role}${profile.sport ? ` • ${profile.sport}` : ''}`,
        verified: profile.verified,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== query);
      return [query, ...filtered].slice(0, 10); // Keep only 10 recent searches
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return useMemo(
    () => ({
      searchQuery,
      searchResults,
      isSearching,
      recentSearches,
      setSearchQuery,
      searchUsers,
      clearSearch,
      addRecentSearch,
      clearRecentSearches,
    }),
    [
      searchQuery,
      searchResults,
      isSearching,
      recentSearches,
      searchUsers,
      clearSearch,
      addRecentSearch,
      clearRecentSearches,
    ],
  );
});
