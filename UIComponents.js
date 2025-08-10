import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// Enhanced Button Component
export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium', 
  loading = false, 
  disabled = false, 
  icon,
  style,
  ...props 
}) => {
  const getButtonStyle = () => {
    const gradientStyles = {
      primary: theme.colors.gradient.primary,
      secondary: theme.colors.gradient.secondary,
      success: theme.colors.gradient.success,
      danger: theme.colors.gradient.danger,
      outline: null
    };

    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 16 },
      medium: { paddingVertical: 12, paddingHorizontal: 20 },
      large: { paddingVertical: 16, paddingHorizontal: 24 }
    };

    return { gradient: gradientStyles[variant], sizeStyle: sizeStyles[size] };
  };

  const { gradient, sizeStyle } = getButtonStyle();
  const isOutline = variant === 'outline';

  if (isOutline) {
    return (
      <TouchableOpacity
        style={[
          componentStyles.button,
          sizeStyle,
          { borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: 'transparent' },
          disabled && componentStyles.buttonDisabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <View style={componentStyles.buttonContent}>
            {icon && <Ionicons name={icon} size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />}
            <Text style={[componentStyles.buttonText, { color: theme.colors.primary }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[componentStyles.button, sizeStyle, disabled && componentStyles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      <LinearGradient
        colors={gradient}
        style={[componentStyles.buttonGradient, sizeStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text.white} />
        ) : (
          <View style={componentStyles.buttonContent}>
            {icon && <Ionicons name={icon} size={20} color={theme.colors.text.white} style={{ marginRight: 8 }} />}
            <Text style={componentStyles.buttonText}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Enhanced Input Component
export const Input = ({ 
  label, 
  error, 
  icon, 
  rightIcon,
  onRightIconPress,
  style,
  ...props 
}) => {
  return (
    <View style={[componentStyles.inputContainer, style]}>
      {label && <Text style={componentStyles.inputLabel}>{label}</Text>}
      <View style={componentStyles.inputWrapper}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={theme.colors.text.secondary} 
            style={componentStyles.inputIcon} 
          />
        )}
        <TextInput
          style={[
            componentStyles.input,
            icon && { paddingLeft: 40 },
            rightIcon && { paddingRight: 40 },
            error && { borderColor: theme.colors.status.danger }
          ]}
          placeholderTextColor={theme.colors.text.light}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity 
            style={componentStyles.rightIcon} 
            onPress={onRightIconPress}
          >
            <Ionicons 
              name={rightIcon} 
              size={20} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={componentStyles.errorText}>{error}</Text>}
    </View>
  );
};

// Card Component
export const Card = ({ children, style, ...props }) => {
  return (
    <View style={[componentStyles.card, style]} {...props}>
      {children}
    </View>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, text, size = 'medium' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'normal':
        return theme.colors.status.success;
      case 'sos':
      case 'danger':
        return theme.colors.status.danger;
      case 'warning':
        return theme.colors.status.warning;
      case 'offline':
      default:
        return theme.colors.status.offline;
    }
  };

  const sizes = {
    small: { width: 8, height: 8 },
    medium: { width: 12, height: 12 },
    large: { width: 16, height: 16 }
  };

  return (
    <View style={componentStyles.statusBadge}>
      <View 
        style={[
          componentStyles.statusDot, 
          sizes[size],
          { backgroundColor: getStatusColor() }
        ]} 
      />
      <Text style={componentStyles.statusText}>{text}</Text>
    </View>
  );
};

// Header Component
export const Header = ({ title, subtitle, rightComponent, style }) => {
  return (
    <View style={[componentStyles.header, style]}>
      <View style={{ flex: 1 }}>
        <Text style={componentStyles.headerTitle}>{title}</Text>
        {subtitle && <Text style={componentStyles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && rightComponent}
    </View>
  );
};

// Enhanced Loading Component with Animation
export const Loading = ({ size = 'large', color = theme.colors.primary, text = 'กำลังโหลด...' }) => {
  return (
    <Animated.View style={componentStyles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[componentStyles.loadingText, { color }]}>{text}</Text>}
    </Animated.View>
  );
};

// Shimmer Loading Component for better UX
export const ShimmerLoader = ({ width, height, borderRadius = theme.borderRadius.md, style }) => {
  const shimmerAnimation = new Animated.Value(0);
  
  React.useEffect(() => {
    const startShimmer = () => {
      shimmerAnimation.setValue(0);
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => startShimmer());
    };
    startShimmer();
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[componentStyles.shimmerContainer, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          componentStyles.shimmerOverlay,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

// Floating Action Button
export const FloatingActionButton = ({ icon, onPress, style, ...props }) => {
  return (
    <TouchableOpacity
      style={[componentStyles.fab, style]}
      onPress={onPress}
      {...props}
    >
      <LinearGradient
        colors={theme.colors.gradient.primary}
        style={componentStyles.fabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={24} color={theme.colors.text.white} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Empty State Component
export const EmptyState = ({ icon, title, subtitle, actionButton }) => {
  return (
    <View style={componentStyles.emptyState}>
      <Ionicons name={icon} size={64} color={theme.colors.text.light} />
      <Text style={componentStyles.emptyStateTitle}>{title}</Text>
      {subtitle && <Text style={componentStyles.emptyStateSubtitle}>{subtitle}</Text>}
      {actionButton && actionButton}
    </View>
  );
};

const componentStyles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.small
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text.white
  },
  buttonDisabled: {
    opacity: 0.6
  },

  // Input Styles
  inputContainer: {
    marginBottom: theme.spacing.md
  },
  inputLabel: {
    ...theme.typography.body2,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs
  },
  inputWrapper: {
    position: 'relative'
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.text.light,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body1,
    color: theme.colors.text.primary
  },
  inputIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    top: '50%',
    marginTop: -10,
    zIndex: 1
  },
  rightIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    marginTop: -10,
    zIndex: 1
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.status.danger,
    marginTop: theme.spacing.xs
  },

  // Card Styles
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.medium
  },

  // Status Badge Styles
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusDot: {
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500'
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...theme.typography.body2,
    marginTop: theme.spacing.md,
    textAlign: 'center'
  },

  // Shimmer Styles
  shimmerContainer: {
    backgroundColor: theme.colors.text.light,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    width: '50%',
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...theme.shadows.large,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl
  },
  emptyStateTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center'
  },
  emptyStateSubtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 24
  }
});
