import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/stores/auth-store';
import { useSubmissionStats, useSubmissions } from '@/src/hooks/useSubmissions';
import { useProfile } from '@/src/hooks/useProfile';
import { useLanguage } from '@/src/stores/language-store';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';
import { CATEGORIES, CATEGORY_COLORS } from '@/src/constants/categories';
import { SUBMISSION_STATUS_LABELS } from '@/src/constants/config';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Car: 'car',
  Droplet: 'water',
  Hospital: 'hospital-building',
  BookOpen: 'book-open-variant',
  Zap: 'lightning-bolt',
  Trash2: 'trash-can',
  Bus: 'bus',
  MoreHorizontal: 'dots-horizontal',
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useSubmissionStats();
  const { data: recentData, isLoading: recentLoading, refetch: refetchRecent } = useSubmissions();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchStats(), refetchRecent()]);
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-2xl font-bold text-gray-800">{t('app.name')}</Text>
        <Text className="text-gray-500 mt-2 text-center">{t('app.tagline')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/language')}
          className="mt-8 bg-primary-500 px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userName = profile?.full_name ?? user?.full_name ?? 'Citizen';
  const constituencyName = profile?.constituency_name ?? user?.constituency_name ?? '';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerClassName="pb-24"
      >
        <View className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {t('home.greeting', { name: userName.split(' ')[0] })}
              </Text>
              {constituencyName && (
                <Text className="text-sm text-gray-500 mt-0.5">{constituencyName}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/language')}
              className="p-2 rounded-full bg-gray-100"
              accessibilityLabel="Change language"
            >
              <MaterialCommunityIcons name="web" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 pt-5">
          {statsLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" className="py-4" />
          ) : stats ? (
            <View className="flex-row gap-3">
              <Card className="flex-1 bg-primary-50 border-primary-200">
                <Text className="text-2xl font-bold text-primary-600">{stats.this_month}</Text>
                <Text className="text-xs text-primary-700 mt-1">{t('home.submissions_this_month', { count: '' }).split('{{count}}').join('')}</Text>
              </Card>
              <Card className="flex-1 bg-success-50 border-success-200">
                <Text className="text-2xl font-bold text-success-600">{stats.resolved_this_month}</Text>
                <Text className="text-xs text-success-700 mt-1">{t('home.issues_resolved', { count: '' }).split('{{count}}').join('')}</Text>
              </Card>
              <Card className="flex-1 bg-warning-50 border-warning-200">
                <Text className="text-2xl font-bold text-warning-600">{stats.under_review}</Text>
                <Text className="text-xs text-warning-700 mt-1">{t('home.under_review', { count: '' }).split('{{count}}').join('')}</Text>
              </Card>
            </View>
          ) : null}
        </View>

        <View className="px-5 pt-6">
          <Text className="text-base font-semibold text-gray-800 mb-3">{t('home.quick_categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
            {CATEGORIES.map((cat) => {
              const iconName = iconMap[cat.icon] || 'dots-horizontal';
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push({ pathname: '/submission/new', params: { category: cat.id } })}
                  className="items-center gap-2 px-3 py-3 rounded-xl bg-white border border-gray-100 min-w-[72px]"
                >
                  <MaterialCommunityIcons name={iconName} size={24} color={CATEGORY_COLORS[cat.id]} />
                  <Text className="text-[10px] font-medium text-gray-600 text-center">{cat.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-800">{t('home.recent_submissions')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/submissions')}>
              <Text className="text-sm text-primary-500 font-medium">{t('home.view_all')}</Text>
            </TouchableOpacity>
          </View>
          {recentLoading ? (
            <ActivityIndicator size="small" color="#3b82f6" className="py-8" />
          ) : recentData?.items && recentData.items.length > 0 ? (
            recentData.items.slice(0, 2).map((item) => (
              <Card
                key={item.id}
                onPress={() => router.push(`/submission/${item.id}`)}
                className="mb-2"
              >
                <View className="flex-row items-center gap-3">
                  {item.thumbnail_url && (
                    <View className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden" />
                  )}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Badge
                        label={SUBMISSION_STATUS_LABELS[item.status]?.label ?? item.status}
                        color={SUBMISSION_STATUS_LABELS[item.status]?.color ?? '#6b7280'}
                      />
                      <Text className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#9ca3af" />
                </View>
              </Card>
            ))
          ) : (
            <View className="py-8 items-center">
              <Text className="text-sm text-gray-400">{t('home.no_recent')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => router.push('/submission/new')}
        className="absolute bottom-6 right-5 w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-lg"
        accessibilityLabel={t('home.new_submission')}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="plus-circle" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
