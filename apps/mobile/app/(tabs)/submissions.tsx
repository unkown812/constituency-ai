import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '@/src/stores/auth-store';
import { useSubmissions } from '@/src/hooks/useSubmissions';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';
import { SUBMISSION_STATUS_LABELS } from '@/src/constants/config';
import { SubmissionStatus } from '@/src/types';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const FILTERS = ['all', 'new', 'under_review', 'resolved', 'closed'] as const;

export default function SubmissionsScreen() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { data, isLoading, isError, refetch, isRefetching } = useSubmissions(
    activeFilter === 'all' ? undefined : activeFilter
  );

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-gray-500 text-center">{t('submissions.empty_message')}</Text>
      </View>
    );
  }

  if (isLoading && !data) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-14 pb-1 px-5 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{t('submissions.title')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-3 px-5 bg-white border-b border-gray-100"
      >
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full ${activeFilter === f ? 'bg-primary-500' : 'bg-gray-100'}`}
            >
              <Text className={`text-sm font-medium ${activeFilter === f ? 'text-white' : 'text-gray-600'}`}>
                {f === 'all' ? t('submissions.all') : t(`status.${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item: { id: string }) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-5 pb-24"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title={t('submissions.empty_title')}
            message={t('submissions.empty_message')}
          />
        }
        renderItem={({ item }: { item: { id: string; title: string; category: string; status: string; thumbnail_url?: string; image_count: number; created_at: string } }) => {
          const statusInfo = SUBMISSION_STATUS_LABELS[item.status] ?? SUBMISSION_STATUS_LABELS.new;
          return (
            <Card
              onPress={() => router.push(`/submission/${item.id}`)}
              className="mb-3"
            >
              <View className="flex-row gap-3">
                {item.thumbnail_url ? (
                  <View className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden" />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
                    <Text className="text-xs text-gray-400">No img</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Badge label={statusInfo.label} color={statusInfo.color} />
                    <Text className="text-xs text-gray-400">
                      {getRelativeTime(item.created_at, t)}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

function getRelativeTime(dateStr: string, t: any): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t('submissions.just_now');
  if (days === 1) return '1d ago';
  return t('submissions.days_ago', { count: days });
}
