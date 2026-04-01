# Role-Specific Interface Design — Implementation Spec

See full spec in the agent output. Key implementation priorities below.

## Phase 1: Role Accent Colors + Tab Bar (IMPLEMENT FIRST)

### Role Accents (add to constants/theme.ts)

- athlete: #30D158 (green)
- scout: #FF9F0A (orange)
- coach: #64D2FF (cyan)
- team/academy: #FF453A (red)
- fan: #BF5AF2 (purple)
- brand: #FF9F0A (orange)
- trainer: #30D158 (green)
- gym: #64D2FF (cyan)

### Tab Bar (update \_layout.tsx)

- Hide Create tab for fans and scouts
- Hide Opportunities tab for fans
- Change tab labels per role (Feed/Dashboard/Coach HQ)
- Use role accent for active tab color

## Phase 2: Shared Components

- SectionHeader, StatsBar, QuickActionsRow, PostCard, UserCard

## Phase 3: Refactor Home Screens with role-specific sections

## Phase 4: Discover screen role adaptation

## Phase 5: Notification priorities per role

Estimated: 10-15 developer-days total
