export const theme = {
  colors: {
    // Dark sporty background
    background: '#1A1A1A', // Charcoal black
    backgroundDeep: '#0F0F0F', // Deep black
    surface: '#2A2A2A', // Dark surface
    surfaceLight: '#3A3A3A', // Lighter surface
    
    // Electric accent colors
    primary: '#39FF14', // Neon green
    primaryDark: '#2ECC11',
    secondary: '#1E90FF', // Electric blue
    accent: '#FF4500', // Fiery orange
    
    // Text colors
    text: '#FFFFFF', // Bold white for headings
    textSecondary: '#B0B0B0', // Light grey for body text
    textMuted: '#6C6C6C', // Muted grey for labels
    
    // Status colors
    success: '#39FF14',
    danger: '#FF4500',
    warning: '#FFD700',
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    border: '#3A3A3A',
    
    // Sporty gradients
    gradient: {
      primary: ['#1A1A1A', '#1E90FF'], // Dark to electric blue
      secondary: ['#2A2A2A', '#39FF14'], // Dark surface to neon green
      accent: ['#FF4500', '#FFD700'], // Orange to gold
      dark: ['#0F0F0F', '#2A2A2A'], // Deep black to charcoal
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
  // Sporty shadows and effects
  shadow: {
    glow: {
      shadowColor: '#39FF14',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    electric: {
      shadowColor: '#1E90FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
    fire: {
      shadowColor: '#FF4500',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
  },
};