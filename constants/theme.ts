export const formatRoleName = (role: string, plural: boolean = false): string => {
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
    // Dark sporty theme colors
    background: '#000000', // Base background color
    backgroundGradient: ['#003300', '#000000'], // Gradient from deep sport green to black
    surface: '#1C1C1E', // Charcoal grey for surfaces
    surfaceLight: '#2C2C2E', // Slightly lighter charcoal
    cardBackground: '#1C1C1E', // Charcoal grey for cards
    
    // Primary colors
    primary: '#30D158', // Sporty green
    primaryDark: '#248A3D', // Darker sporty green
    primaryLight: '#0A2F1C', // Dark green tint for highlights
    secondary: '#30D158', // Sporty green
    accent: '#30D158', // Sporty green
    
    // Status colors
    warning: '#FF9F0A', // Sporty orange
    info: '#64D2FF', // Sporty blue
    orange: '#FF9F0A', // Sporty orange
    
    // Text colors
    text: '#FFFFFF', // White text
    textSecondary: '#C7C7CC', // Light grey
    textMuted: '#8E8E93', // Dim grey
    textOnCard: '#FFFFFF', // White text on cards
    textOnLight: '#000000', // Black text on light backgrounds
    textOnDark: '#FFFFFF', // White text on dark backgrounds
    textPrimary: '#FFFFFF', // White text
    textLight: '#C7C7CC', // Light grey
    
    // Status colors
    success: '#30D158', // Sporty green
    danger: '#FF453A', // Sporty red
    successBg: '#0A2F1C', // Dark green background
    dangerBg: '#3A0A0A', // Dark red background
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    border: '#38383A', // Dark border
    borderLight: '#48484A', // Slightly lighter border
    
    // Card and surface colors
    cardBg: '#1C1C1E', // Charcoal grey
    surfaceDark: '#1C1C1E', // Charcoal grey
    inputBackground: '#2C2C2E', // Slightly lighter charcoal
    
    // Sporty gradients
    gradient: {
      primary: ['#30D158', '#248A3D'], // Sporty green gradient
      secondary: ['#30D158', '#248A3D'], // Sporty green gradient
      accent: ['#FF9F0A', '#FF8000'], // Sporty orange gradient
      dark: ['#1C1C1E', '#000000'], // Dark gradient
      energetic: ['#64D2FF', '#0A84FF'], // Sporty blue gradient
      fire: ['#FF453A', '#FF9F0A'], // Sporty red to orange gradient
      navy: ['#0A84FF', '#0040DD'], // Sporty blue gradient
      sport: ['#003300', '#000000'], // Deep sport green to black gradient
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const, // For sporty headings
  },
  // Standard shadows
  shadow: {
    // Success shadow
    glow: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    // Primary shadow
    electric: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    // Danger shadow
    fire: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    // Notification shadow
    notification: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 1,
    },
    // Secondary shadow
    cyan: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    // Card shadow
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
};