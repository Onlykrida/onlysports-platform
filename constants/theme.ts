export const theme = {
  colors: {
    // Dark sporty background (Charcoal Black base)
    background: '#121212', // Charcoal Black - power and focus
    backgroundDeep: '#0A0A0A', // Deep black for depth
    surface: '#1E1E1E', // Dark surface cards
    surfaceLight: '#2A2A2A', // Lighter surface elements
    cardBackground: '#E0E0E0', // Platinum Grey for card backgrounds
    
    // Primary Sport Colors (Energetic + Bold)
    primary: '#007BFF', // Electric Blue - energetic, professional, fresh
    primaryDark: '#0056B3', // Darker blue for pressed states
    secondary: '#00D26A', // Neon Green - sporty, modern, dynamic
    accent: '#FF3B30', // Crimson Red - passion, energy, urgency
    
    // Secondary Sport Colors (Balance + Style)
    warning: '#FFD600', // Sunburst Yellow - optimism and speed
    info: '#00E5FF', // Cyan - freshness & tech-sporty vibe
    orange: '#FF6F00', // Orange - energy and excitement
    
    // Text colors (Clean and readable)
    text: '#FFFFFF', // Bold white for headings (Oswald/Bebas Neue style)
    textSecondary: '#B0B0B0', // Light grey for body text (Poppins/Inter/Roboto)
    textMuted: '#6C6C6C', // Muted grey for labels/secondary info
    textOnCard: '#121212', // Dark text for light card backgrounds
    
    // Status colors
    success: '#00D26A', // Neon Green for success states
    danger: '#FF3B30', // Crimson Red for errors
    successBg: '#00D26A20', // Success background with opacity
    dangerBg: '#FF3B3020', // Danger background with opacity
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    border: '#2A2A2A',
    borderLight: '#3A3A3A',
    
    // Sporty gradients (Dynamic background gradients)
    gradient: {
      primary: ['#121212', '#007BFF'], // Charcoal to Electric Blue streaks
      secondary: ['#121212', '#00D26A'], // Charcoal to Neon Green
      accent: ['#FF3B30', '#FF6F00'], // Crimson to Orange fire
      dark: ['#0A0A0A', '#1E1E1E'], // Deep black gradient
      energetic: ['#007BFF', '#00E5FF'], // Electric blue to cyan
      fire: ['#FF6F00', '#FFD600'], // Orange to yellow energy
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
      shadowColor: '#00D26A',
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