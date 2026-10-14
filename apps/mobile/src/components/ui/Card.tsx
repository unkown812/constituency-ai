import { View, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Card({ children, onPress, className = '', style }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
