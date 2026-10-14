import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
}

export function EmptyState({
  icon: iconName = 'inbox',
  title,
  message,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <MaterialCommunityIcons name={iconName} size={64} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-500 mt-4 text-center">
        {title}
      </Text>
      <Text className="text-sm text-gray-400 mt-2 text-center leading-5">
        {message}
      </Text>
    </View>
  );
}
