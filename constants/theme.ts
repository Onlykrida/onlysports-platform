export const theme = {
  colors: {
    // Light theme colors
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceLight: '#FFFFFF',
    cardBackground: '#FFFFFF',
    
    // Primary colors
    primary: '#007BFF',
    primaryDark: '#0056B3',
    secondary: '#28A745',
    accent: '#FFC107',
    
    // Status colors
    warning: '#FFC107',
    info: '#17A2B8',
    orange: '#FD7E14',
    
    // Text colors
    text: '#212529',
    textSecondary: '#6C757D',
    textMuted: '#ADB5BD',
    textOnCard: '#212529',
    textOnLight: '#212529',
    textOnDark: '#FFFFFF',
    textPrimary: '#212529',
    textLight: '#6C757D',
    
    // Status colors
    success: '#28A745',
    danger: '#DC3545',
    successBg: '#D4EDDA',
    dangerBg: '#F8D7DA',
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    border: '#DEE2E6',
    borderLight: '#E9ECEF',
    
    // Card and surface colors
    cardBg: '#FFFFFF',
    surfaceDark: '#F8F9FA',
    inputBackground: '#FFFFFF',
    
    // Simple gradients
    gradient: {
      primary: ['#007BFF', '#0056B3'],
      secondary: ['#28A745', '#1E7E34'],
      accent: ['#FFC107', '#E0A800'],
      dark: ['#343A40', '#212529'],
      energetic: ['#007BFF', '#17A2B8'],
      fire: ['#FD7E14', '#FFC107'],
      navy: ['#007BFF', '#0056B3'],
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