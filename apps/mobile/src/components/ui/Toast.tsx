import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ToastContentProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  success: 'check-circle',
  error: 'close-circle',
  info: 'alert-circle',
};

const bgColors = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  info: 'bg-primary-500',
};

export function ToastContent({ message, type = 'info' }: ToastContentProps) {
  const iconName = icons[type];
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 rounded-xl ${bgColors[type]}`}>
      <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
      <Text className="text-white font-medium text-sm flex-1">{message}</Text>
    </View>
  );
}
