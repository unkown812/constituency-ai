import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/stores/auth-store';
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile';
import { useLanguage } from '@/src/stores/language-store';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';
import { LANGUAGES } from '@/src/constants/languages';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfile();

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <MaterialCommunityIcons name="account" size={64} color="#d1d5db" />
        <Text className="text-gray-500 mt-4 text-center">{t('profile.title')}</Text>
      </View>
    );
  }

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  const displayName = profile?.full_name ?? user?.full_name ?? 'User';
  const phone = profile?.phone ?? user?.phone ?? '';
  const constituency = profile?.constituency_name ?? user?.constituency_name ?? '';
  const langName = LANGUAGES.find((l) => l.code === currentLanguage);

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logout_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleAvatarPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera roll access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets.length > 0) {
      updateProfile.mutate({ full_name: displayName });
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-12">
      <View className="pt-14 pb-6 px-5 bg-white border-b border-gray-100 items-center">
        <TouchableOpacity
          onPress={handleAvatarPick}
          className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-3"
          accessibilityLabel={t('profile.edit_avatar')}
        >
          <MaterialCommunityIcons name="account" size={36} color="#3b82f6" />
          <View className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1.5">
            <MaterialCommunityIcons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{displayName}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{phone}</Text>
        {constituency && (
          <View className="flex-row items-center gap-1 mt-1">
            <Text className="text-xs text-gray-400">{t('profile.constituency')}: {constituency}</Text>
          </View>
        )}
      </View>

      <View className="px-5 pt-6 gap-3">
        <Card>
          <TouchableOpacity
            onPress={() => router.push('/language')}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name="translate" size={20} color="#374151" />
              <View>
                <Text className="text-sm font-medium text-gray-800">{t('profile.language')}</Text>
                <Text className="text-xs text-gray-500">{langName?.name_native ?? 'English'}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name="bell-outline" size={20} color="#374151" />
              <Text className="text-sm font-medium text-gray-800">{t('profile.notifications')}</Text>
            </View>
            <Switch
              value={profile?.notification_enabled ?? true}
              onValueChange={(value) => updateProfile.mutate({ notification_enabled: value })}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={profile?.notification_enabled ? '#3b82f6' : '#f4f4f5'}
            />
          </View>
        </Card>

        <Card>
          <TouchableOpacity className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name="information" size={20} color="#374151" />
              <Text className="text-sm font-medium text-gray-800">{t('profile.about')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View className="h-px bg-gray-100 my-2" />
          <TouchableOpacity className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <MaterialCommunityIcons name="shield-account" size={20} color="#374151" />
              <Text className="text-sm font-medium text-gray-800">{t('profile.privacy_policy')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </Card>

        <Button
          title={t('profile.logout')}
          variant="danger"
          icon="logout"
          onPress={handleLogout}
          className="mt-4"
        />
      </View>
    </ScrollView>
  );
}
