import { theme } from '@/constants/theme';

// Shared category → color mapping for opportunity tags. Lived as a dead
// private helper in the opportunities tab (tags hardcoded green) until the
// design audit wired it up; shared here so the detail screen stays in sync.
export function getOpportunityTypeColor(type: string): string {
  switch (type) {
    case 'tryouts':
      return theme.colors.primary;
    case 'tournaments':
      return theme.colors.cyan;
    case 'sponsorships':
      return theme.colors.accent;
    case 'scholarships':
      return theme.colors.purple;
    case 'contracts':
      return theme.colors.gold;
    default:
      return theme.colors.textSecondary;
  }
}
