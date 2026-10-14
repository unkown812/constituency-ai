import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-gray-100 active:bg-gray-200',
  outline: 'border border-primary-500 active:bg-primary-50',
  ghost: 'active:bg-gray-100',
  danger: 'bg-danger-500 active:bg-danger-600',
};

const textStyles = {
  primary: 'text-white',
  secondary: 'text-gray-800',
  outline: 'text-primary-500',
  ghost: 'text-gray-700',
  danger: 'text-white',
};

const sizeStyles = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-5 py-3 rounded-xl',
  lg: 'px-6 py-4 rounded-xl',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: iconName,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      className={`flex-row items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#3b82f6'}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconName && <MaterialCommunityIcons name={iconName} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} color={variant === 'primary' || variant === 'danger' ? '#fff' : '#374151'} />}
          <Text className={`font-semibold ${textStyles[variant]} ${textSizes[size]}`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
