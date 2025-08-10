export const theme = {
  colors: {
    primary: '#FF6B35',
    primaryDark: '#E85A2B',
    secondary: '#2E86AB',
    secondaryDark: '#235A75',
    accent: '#A23B72',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: {
      primary: '#212529',
      secondary: '#6C757D',
      light: '#ADB5BD',
      white: '#FFFFFF'
    },
    status: {
      success: '#28A745',
      warning: '#FFC107',
      danger: '#DC3545',
      info: '#17A2B8',
      offline: '#6C757D'
    },
    gradient: {
      primary: ['#FF6B35', '#F7931E'],
      secondary: ['#2E86AB', '#A23B72'],
      success: ['#56CCF2', '#2F80ED'],
      danger: ['#FF6B6B', '#FF5252']
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.1)',
      medium: 'rgba(0, 0, 0, 0.15)',
      dark: 'rgba(0, 0, 0, 0.25)'
    }
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 50
  },
  
  shadows: {
    small: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    },
    medium: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4
    },
    large: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8
    }
  }
};
