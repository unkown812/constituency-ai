import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/src/components/ui/Button';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-8">
      <Text className="text-xl font-bold text-gray-900 mb-2">Welcome to Constituency AI</Text>
      <Text className="text-sm text-gray-500 text-center mb-6 leading-5">
        Your voice matters. Submit issues, track progress, and help improve your constituency.
      </Text>
      <Button
        title="Get Started"
        onPress={() => router.dismissAll()}
        size="lg"
      />
    </View>
  );
}
