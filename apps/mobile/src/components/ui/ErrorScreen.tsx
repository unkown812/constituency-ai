import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  message = 'Something went wrong',
  onRetry,
}: ErrorScreenProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 bg-gray-50">
      <MaterialCommunityIcons name="alert-circle" size={56} color="#ef4444" />
      <Text className="text-lg font-semibold text-gray-700 mt-4 text-center">
        {message}
      </Text>
      {onRetry && (
        <Button
          title="Retry"
          variant="outline"
          onPress={onRetry}
          className="mt-6"
        />
      )}
    </View>
  );
}
