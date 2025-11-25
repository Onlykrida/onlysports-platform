# Component Reference
Detailed descriptions of every reusable component shipped with the app.

## Button (`components/Button.tsx`)
- **Role:** Primary CTA builder with multiple visual variants (primary, secondary, accent, outline, ghost, success, danger) and four sizes for consistent sporty UI.
- **Key props:** `title`, `onPress`, `variant`, `size`, `loading`, `disabled`, optional `icon`, plus `style` overrides for layout tweaks.
- **Behavior:** Disables interaction when loading/disabled, swaps label for spinner, uses theme shadows, uppercase text, and spacing that matches the athletic brand.

## CommentsModal (`components/CommentsModal.tsx`)
- **Role:** Full-screen sheet to browse, post, and like comments tied to a post, backed by Supabase tables (`comments`, `comment_likes`).
- **Key flows:** Fetches comments + like state on open, allows posting new comments, toggling likes with optimistic UI, and refreshes feed counts via `usePosts().refreshPosts`.
- **UX notes:** Keyboard-aware composer, avatars, relative timestamps, empty/loading states, and optimistic heart counter that mirrors native social apps.

## ConfirmDialog (`components/ConfirmDialog.tsx`)
- **Role:** Lightweight confirmation modal with optional destructive styling for irreversible actions.
- **Key props:** `visible`, `title`, `message`, `confirmText`, `cancelText`, optional `destructive`, and handlers for cancel/confirm events (sync or async).
- **UX notes:** Uses semi-transparent backdrop, button variants, and testIDs so automation can assert destructive flows.

## DatabaseSetupChecker (`components/DatabaseSetupChecker.tsx`)
- **Role:** Self-diagnostic card that verifies Supabase connectivity, tables, and RLS policies to guide onboarding.
- **Behavior:** Runs a lightweight `profiles` query, surfaces status pills, shows actionable error copy per failure, and offers “Recheck” plus setup instructions.
- **Use case:** Drop into debug/empty states to help non-technical users finish backend setup without digging into logs.

## EditPostModal (`components/EditPostModal.tsx`)
- **Role:** Page-sheet modal for editing existing post content inline.
- **Key props:** `visible`, `initialContent`, `onSave`, `onClose`.
- **Behavior:** Tracks local text, enforces non-empty save, invokes async `onSave`, closes via icon, and exposes close/save testIDs for E2E coverage.

## ErrorBoundary (`components/ErrorBoundary.tsx`)
- **Role:** Class-based boundary wrapping the app to catch runtime errors and provide graceful recovery messaging.
- **Behavior:** Special-cases Expo OTA failures, auto-resets for update errors, logs stack traces, and renders retry UI for other issues to prevent blank screens.
- **Usage:** Wrap top-level navigator or entire app tree for robust crash handling.

## Input (`components/Input.tsx`)
- **Role:** Branded text field supporting labels, icons, validation copy, and password visibility toggles.
- **Key props:** All native `TextInput` props plus `label`, `error`, `icon`, and semantic `type` (`text`, `email`, `password`).
- **Behavior:** Applies uppercase labels, dynamic keyboard types, secure-entry toggle button, and bold error text with theme-driven borders.

## PostActionsMenu (`components/PostActionsMenu.tsx`)
- **Role:** Bottom-sheet contextual menu for editing or deleting posts.
- **Key props:** `visible`, `onClose`, `onEdit`, `onDelete`.
- **UX notes:** Minimal action list with lucide icons, destructive styling + border separator, and overlay backdrop respecting modern mobile sheets.

## VideoPlayer (`components/VideoPlayer.tsx`)
- **Role:** Thin wrapper around `expo-video` with poster + fallback support to keep feed media resilient on every platform.
- **Behavior:** Attempts to lazy-require `expo-video`, plays with native controls, loops/mutes per props, and falls back to poster image or solid block plus error logging when playback fails.
- **Key props:** `uri`, optional `poster`, `autoPlay`, `loop`, `muted`, explicit sizing, and `testID` hook for tests.

## ShareModal (`components/ShareModal.tsx`)
- **Role:** Sheet for sharing a post into direct conversations.
- **Behavior:** Shows post preview, searchable conversation list from `useMessages`, builds rich text link payload with post snippet, and surfaces success/error alerts with loading indicator per share.
- **Key props:** `visible`, `onClose`, `post` (includes author + media metadata).

## CreateOpportunityModal (`components/CreateOpportunityModal.tsx`)
- **Role:** Multi-step composer for opportunity listings (tryouts, tournaments, sponsorships, scholarships, jobs, camps).
- **Flow:** Step 1 selects category (icon cards). Step 2 shows dynamic form with validation, requirement list builder, category-specific fields, and submit button using `useOpportunities().createOpportunity`.
- **UX details:** Safe-area sheet, sticky header, activity indicator on submit, and structured alerts for validation errors.

## BackgroundGradient (`components/BackgroundGradient.tsx`)
- **Role:** Layout wrapper applying a vertical dark-sport gradient using `expo-linear-gradient` behind arbitrary children.
- **Usage:** Wrap screens needing immersive green-to-black backdrop without duplicating gradient code, ensuring consistent atmospheric styling.

## PostSkeleton (`components/PostSkeleton.tsx`)
- **Role:** Animated shimmer placeholders while feed posts load.
- **Behavior:** Uses `Animated.loop` on opacity to pulse avatar/body/media blocks, supports configurable `count`, memoizes placeholder array, and logs mount/unmount for debugging.
- **Testing:** Exposes deterministic `testID`s for each skeleton card and action stub so tests can wait for data replacement.
