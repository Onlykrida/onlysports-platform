# OnlyKrida MVP Build Plan

## Project Context

OnlyKrida is a sports networking app (LinkedIn for sports) built with React Native (Expo SDK 54) + TypeScript + Supabase. Target: Indian grassroots athletes, scouts, coaches.

## What's Already Done (Wave 1 - Completed 2026-03-30)

### Claude AI Brain

- `services/ai.ts` — Claude API client (Opus 4.6 for deep analysis, Sonnet 4.6 for fast tasks)
- `hooks/ai-context.tsx` — React context for all AI features
- `app/ai-assistant.tsx` — Full-screen AI chat with typing indicator, quick actions
- `components/AIProfileCoach.tsx` — Collapsible AI suggestions on profile screen
- `components/AIScoutCard.tsx` — AI-powered athlete recommendation cards
- AI FAB on home screen (sparkles button bottom-left)
- AIProvider wired into `app/_layout.tsx`

### New UI Components

- `components/CachedImage.tsx` — expo-image wrapper with memory-disk caching, blurhash, error fallback
- `components/AnimatedCard.tsx` — Staggered fade-in entrance animation
- `components/Logo.tsx` — SVG logo with K icon + OnlyKrida text
- `components/EmptyState.tsx` — 8 presets (feed, messages, notifications, etc.) with encouraging copy
- `components/ProfileCompletion.tsx` — Profile strength progress bar (integrated into profile screen)
- `constants/performance.ts` — Shared FlatList perf config

### Performance Fixes Done

- `app/_layout.tsx` — Context providers grouped into 4 memoized wrappers (SocialProviders, CommunicationProviders, ContentProviders) + MemoizedAppStack
- FlatList perf props added to AthleteHome main feed + messages lists
- Tab bar: Create tab has green circle background + haptic feedback

### UX Improvements Done

- Welcome screen: Logo component, fade-in animation, "Powered by AI" badge
- Profile screen: ProfileCompletion + AIProfileCoach integrated
- .env updated with EXPO_PUBLIC_ANTHROPIC_API_KEY

---

## Wave 2 — In Progress

### 2A. CachedImage Migration (PARTIALLY DONE)

Replace all `<Image source={{ uri: ... }}>` and `via.placeholder.com` URLs with `<CachedImage>`.

**Done:** discover.tsx (2 images), messages.tsx (2 images)

**Still needed:**

- `app/chat/[id].tsx` — message avatars
- `app/chat/group/[id].tsx` — group chat avatars
- `app/(tabs)/notifications.tsx` — notification avatars
- `app/(tabs)/profile.tsx` — profile avatar + cover photo
- `app/user/[id].tsx` — public profile avatar + cover
- `components/home/AthleteHome.tsx` — post avatars, opportunity images
- `components/home/ScoutHome.tsx` — athlete avatars
- `components/home/CoachHome.tsx` — athlete chips, post avatars
- `components/home/TeamHome.tsx` — roster avatars
- `components/home/BrandHome.tsx` — athlete avatars
- `components/home/FanHome.tsx` — post avatars
- `components/CommentsModal.tsx` — commenter avatars
- `components/VideoPlayer.tsx` — poster image

**Pattern:**

```tsx
// Before:
<Image source={{ uri: item.avatar || 'https://via.placeholder.com/50' }} style={styles.avatar} />

// After:
<CachedImage source={item.avatar} size={50} placeholder="avatar" />
```

Import: `import CachedImage from '@/components/CachedImage';`
Remove `Image` from react-native imports if no longer used.

### 2B. Discover Screen useReducer Rewrite

File: `app/(tabs)/discover.tsx`

The screen has 17 separate useState hooks (lines 31-47). Consolidate into:

```tsx
interface DiscoverState {
  searchQuery: string;
  selectedSport: string | null;
  selectedRole: string | null;
  users: User[];
  isLoading: boolean;
  showSearchResults: boolean;
  error: string | null;
  hasInitializedFilters: boolean;
  showFilterModal: boolean;
  tempSport: string | null;
  tempRole: string | null;
  tempLocation: string;
  tempVerified: boolean;
  locationFilter: string;
  verifiedOnly: boolean;
  sportDropdownOpen: boolean;
  roleDropdownOpen: boolean;
}

type DiscoverAction =
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_USERS'; users: User[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'OPEN_FILTER_MODAL' }
  | { type: 'CLOSE_FILTER_MODAL' }
  | { type: 'APPLY_FILTERS' }
  | { type: 'RESET_FILTERS' };
// ... etc
```

### 2C. FlatList Performance Props

Add to ALL remaining FlatLists (25+ instances):

```tsx
maxToRenderPerBatch={8}
windowSize={5}
initialNumToRender={10}
removeClippedSubviews={Platform.OS === 'android'}
```

Files: ScoutHome, CoachHome, TeamHome, BrandHome, FanHome, notifications, chat/[id], chat/group/[id], opportunities, CommentsModal, ShareModal

### 2D. Component Refactoring

Break monolithic components into sub-components:

**AthleteHome.tsx (666 lines) → orchestrator + 5 sub-components:**

- `components/home/athlete/AthleteHeader.tsx` — welcome + stats bar
- `components/home/athlete/AthleteFeed.tsx` — post FlatList
- `components/home/athlete/AthleteQuickActions.tsx` — CTA buttons
- `components/home/athlete/OpportunityPreview.tsx` — opportunity cards
- `components/home/athlete/CoachSuggestions.tsx` — interested orgs

**ScoutHome.tsx (480 lines) → orchestrator + 4 sub-components:**

- `components/home/scout/ScoutDashboard.tsx` — stats overview
- `components/home/scout/AthleteSearchResults.tsx` — athlete cards
- `components/home/scout/ShortlistPreview.tsx` — shortlist
- `components/home/scout/RecommendedAthletes.tsx` — AI recommendations

**CoachHome.tsx (411 lines) → orchestrator + 3 sub-components:**

- `components/home/coach/CoachDashboard.tsx` — stats + quick actions
- `components/home/coach/TeamRoster.tsx` — athlete list
- `components/home/coach/TrainingOpportunities.tsx` — mini feed

**Shared components (used across multiple homes):**

- `components/home/shared/PostCard.tsx` — unified post card
- `components/home/shared/UserCard.tsx` — user preview card
- `components/home/shared/SectionHeader.tsx` — section headers

### 2E. Skeleton Screens

Add missing skeletons:

- `ChatSkeleton` for chat/[id].tsx
- `UserProfileSkeleton` for user/[id].tsx
- `DiscoverSkeleton` for discover.tsx
- `FeedSkeleton` for home screens

### 2F. Onboarding UX

- Add step indicators to auth flow (role-selection → signup)
- Add encouraging microcopy
- Simplify forms (required vs optional fields)
- Add skip buttons for non-critical fields

---

## Wave 3 — Future (after Supabase reconnection)

### 3A. Supabase Sync

- Verify all 19 tables exist
- Run missing migrations (group messaging, fitness tests, team dashboard)
- Consolidate all SQL into canonical schema
- Seed realistic test data (50+ athletes, 10 scouts, 5 coaches, 100 posts, 20 opportunities)

### 3B. Advanced AI Features

- Wire AIScoutCard into ScoutHome recommendations section
- Add AI-powered opportunity matching to opportunities tab
- Add "AI Summary" button on public profiles (user/[id].tsx)

### 3C. Polish

- Screen transition animations
- Pull-to-refresh custom indicator
- Error boundary per route
- Consistent loading → skeleton transitions

---

## Commands

```bash
npx expo start          # Dev server
npx expo start --web    # Web dev server
npx tsc --noEmit        # TypeScript check
npx expo lint           # Lint
```

## Key Files

- Theme: `constants/theme.ts`
- Types: `types/index.ts`
- Supabase: `constants/supabase.ts`
- AI Service: `services/ai.ts`
- All contexts: `hooks/*-context.tsx`
- Tab layout: `app/(tabs)/_layout.tsx`
- Root layout: `app/_layout.tsx`
