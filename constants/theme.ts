export const theme = {
  colors: {
    // Dark sporty background (Deep Navy/Black base inspired by SportsRecruits)
    background: '#0A0A23', // Deep Navy - professional sports platform feel
    backgroundDeep: '#050511', // Deeper navy for depth
    surface: '#1A1A3A', // Dark navy surface cards
    surfaceLight: '#2A2A4A', // Lighter navy surface elements
    cardBackground: '#1A1A3A', // Dark navy card background for better contrast
    
    // Primary Sport Colors (Energetic + Bold)
    primary: '#007BFF', // Electric Blue - energetic, professional, fresh
    primaryDark: '#0056B3', // Darker blue for pressed states
    secondary: '#39FF14', // Neon Green - sporty, modern, dynamic (brighter for visibility)
    accent: '#FF4500', // Fiery Orange - passion, energy, urgency
    
    // Secondary Sport Colors (Balance + Style)
    warning: '#FFD600', // Sunburst Yellow - optimism and speed
    info: '#1E90FF', // Electric Blue - freshness & tech-sporty vibe
    orange: '#FF6F00', // Orange - energy and excitement
    
    // Text colors (Clean and readable - HIGH CONTRAST)
    text: '#FFFFFF', // Pure white for maximum contrast on dark backgrounds
    textSecondary: '#E0E0E0', // Very light grey for body text (better visibility)
    textMuted: '#B0B0B0', // Light grey for labels/secondary info (improved contrast)
    textOnCard: '#FFFFFF', // Pure white text for dark card backgrounds
    textOnLight: '#FFFFFF', // White text for dark backgrounds
    textOnDark: '#FFFFFF', // White text for dark backgrounds
    textPrimary: '#FFFFFF', // Primary text color for dark theme
    textLight: '#F0F0F0', // Very light text for maximum contrast
    
    // Status colors
    success: '#39FF14', // Bright Neon Green for success states (high visibility)
    danger: '#FF3B30', // Crimson Red for errors
    successBg: '#39FF1420', // Success background with opacity
    dangerBg: '#FF3B3020', // Danger background with opacity
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    border: '#3A3A5A', // Lighter border for better visibility
    borderLight: '#4A4A6A', // Even lighter border
    
    // Card and surface colors for better contrast
    cardBg: '#1A1A3A', // Dark navy card background
    surfaceDark: '#2A2A4A', // Darker navy surface for better contrast
    inputBackground: '#2A2A4A', // Dark navy input background
    
    // Sporty gradients (Dynamic background gradients)
    gradient: {
      primary: ['#0A0A23', '#007BFF'], // Deep Navy to Electric Blue streaks
      secondary: ['#0A0A23', '#39FF14'], // Deep Navy to Neon Green
      accent: ['#FF4500', '#FF6F00'], // Fiery Orange to Orange fire
      dark: ['#050511', '#1A1A3A'], // Deep navy gradient
      energetic: ['#007BFF', '#1E90FF'], // Electric blue to electric blue
      fire: ['#FF6F00', '#FFD600'], // Orange to yellow energy
      navy: ['#0A0A23', '#2A2A4A'], // Navy gradient for backgrounds
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
  // Sporty shadows and effects (Micro-animations & glows)
  shadow: {
    // Neon Green glow for success states and active elements
    glow: {
      shadowColor: '#39FF14',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 10,
    },
    // Electric Blue glow for primary buttons and highlights
    electric: {
      shadowColor: '#007BFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 15,
    },
    // Crimson Red glow for CTAs and urgent actions
    fire: {
      shadowColor: '#FF3B30',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    // Orange glow for notifications and badges
    notification: {
      shadowColor: '#FF6F00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 6,
      elevation: 6,
    },
    // Cyan glow for secondary accents
    cyan: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 12,
    },
    // Subtle card shadow
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};