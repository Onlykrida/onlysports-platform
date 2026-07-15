export const formatRoleName = (role: string, plural: boolean = false): string => {
  if (!role) return plural ? 'Users' : 'User';

  const roleMap: Record<string, { singular: string; plural: string }> = {
    athlete: { singular: 'Athlete', plural: 'Athletes' },
    coach: { singular: 'Coach', plural: 'Coaches' },
    scout: { singular: 'Scout', plural: 'Scouts' },
    trainer: { singular: 'Gym Trainer', plural: 'Gym Trainers' },
    team: { singular: 'Team/Club/Academy', plural: 'Teams/Clubs/Academies' },
    academy: { singular: 'Academy', plural: 'Academies' },
    fan: { singular: 'Fan', plural: 'Fans' },
    brand: { singular: 'Brand', plural: 'Brands' },
    gym: { singular: 'Gym', plural: 'Gyms' },
  };

  const roleLower = role.toLowerCase();
  const roleData = roleMap[roleLower];

  if (roleData) {
    return plural ? roleData.plural : roleData.singular;
  }

  // Fallback for unknown roles
  const formatted = role.charAt(0).toUpperCase() + role.slice(1);
  return plural ? formatted + 's' : formatted;
};

export const theme = {
  colors: {
    // Street culture dark theme
    background: '#0a0a0a',
    backgroundGradient: ['#0a1a0a', '#0a0a0a'],
    surface: '#141414',
    surfaceLight: '#1e1e1e',
    cardBackground: '#141414',

    // Primary colors
    primary: '#30D158',
    primaryDark: '#248A3D',
    primaryLight: '#0A2F1C',
    secondary: '#30D158',
    accent: '#FF9F0A', // Orange accent for street vibe

    // Street palette
    orange: '#FF9F0A',
    cyan: '#64D2FF',
    red: '#FF453A',
    neonGreen: '#30D158',
    purple: '#BF5AF2', // vertical jump / power accent
    gold: '#FFD700', // center_tested "Official" verification tier
    warning: '#FF9F0A',
    info: '#64D2FF',

    // Text colors
    text: '#f0f0f0',
    textSecondary: '#C7C7CC',
    textMuted: '#9A9AA0', // lifted from #888 — AA contrast on card surfaces (design audit W1)
    textOnCard: '#f0f0f0',
    textOnLight: '#0a0a0a',
    textOnDark: '#f0f0f0',
    textPrimary: '#f0f0f0',
    textLight: '#C7C7CC',

    // Status colors
    success: '#30D158',
    danger: '#FF453A',
    successBg: '#0A2F1C',
    dangerBg: '#3A0A0A',

    // Utility colors
    white: '#f0f0f0',
    black: '#0a0a0a',
    border: '#2a2a2a',
    borderLight: '#383838',

    // Card and surface colors
    cardBg: '#1a1a1a',
    cardBorder: 'rgba(255,255,255,0.08)',
    surfaceDark: '#0a0a0a',
    inputBackground: '#111111',

    // Street gradients
    gradient: {
      primary: ['#30D158', '#248A3D'],
      secondary: ['#30D158', '#248A3D'],
      accent: ['#FF9F0A', '#FF8000'],
      dark: ['#141414', '#0a0a0a'],
      energetic: ['#64D2FF', '#0A84FF'],
      fire: ['#FF453A', '#FF9F0A'],
      navy: ['#0A84FF', '#0040DD'],
      sport: ['#0a1a0a', '#0a0a0a'],
      street: ['#FF9F0A', '#FF453A'],
      neon: ['#30D158', '#64D2FF'],
    },
  },
  spacing: {
    xs: 2,
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    xxl: 40,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
    hero: 44,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
    widest: 4,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const, // For sporty headings
  },
  // Neon glow shadows
  shadow: {
    glow: {
      shadowColor: '#30D158',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    electric: {
      shadowColor: '#30D158',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },
    fire: {
      shadowColor: '#FF453A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    notification: {
      shadowColor: '#FF9F0A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    cyan: {
      shadowColor: '#64D2FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    ctaGlow: {
      shadowColor: '#30D158',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  dashBorder: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.08)',
  },
};

// Role-specific accent colors for differentiated experiences
export const roleAccents: Record<
  string,
  {
    accent: string;
    accentBg: string;
    gradient: [string, string];
  }
> = {
  athlete: {
    accent: '#30D158',
    accentBg: 'rgba(48,209,88,0.08)',
    gradient: ['#30D158', '#248A3D'],
  },
  scout: { accent: '#FF9F0A', accentBg: 'rgba(255,159,10,0.08)', gradient: ['#FF9F0A', '#FF8000'] },
  coach: {
    accent: '#64D2FF',
    accentBg: 'rgba(100,210,255,0.08)',
    gradient: ['#64D2FF', '#0A84FF'],
  },
  team: { accent: '#FF453A', accentBg: 'rgba(255,69,58,0.08)', gradient: ['#FF453A', '#D32F2F'] },
  academy: {
    accent: '#FF453A',
    accentBg: 'rgba(255,69,58,0.08)',
    gradient: ['#FF453A', '#D32F2F'],
  },
  fan: { accent: '#BF5AF2', accentBg: 'rgba(191,90,242,0.08)', gradient: ['#BF5AF2', '#9B30FF'] },
  brand: { accent: '#FF9F0A', accentBg: 'rgba(255,159,10,0.08)', gradient: ['#FF9F0A', '#FF6B00'] },
  trainer: {
    accent: '#30D158',
    accentBg: 'rgba(48,209,88,0.08)',
    gradient: ['#30D158', '#248A3D'],
  },
  gym: { accent: '#64D2FF', accentBg: 'rgba(100,210,255,0.08)', gradient: ['#64D2FF', '#0A84FF'] },
};
