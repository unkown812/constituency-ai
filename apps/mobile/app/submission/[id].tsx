import { View, Text, ScrollView, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';

import { useSubmissionDetail, useSubmitFeedback } from '@/src/hooks/useSubmissions';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { LoadingScreen } from '@/src/components/ui/LoadingScreen';
import { ErrorScreen } from '@/src/components/ui/ErrorScreen';
import { SUBMISSION_STATUS_LABELS } from '@/src/constants/config';
import { CATEGORY_COLORS } from '@/src/constants/categories';
import { TimelineEvent } from '@/src/types';

const TIMELINE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  send: 'send',
  cpu: 'memory',
  'check-circle': 'check-circle',
  eye: 'eye',
};

export default function SubmissionDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: submission, isLoading, isError, refetch } = useSubmissionDetail(id ?? '');
  const feedbackMutation = useSubmitFeedback();

  if (isLoading) return <LoadingScreen />;
  if (isError || !submission) return <ErrorScreen onRetry={refetch} />;

  const statusInfo = SUBMISSION_STATUS_LABELS[submission.status] ?? SUBMISSION_STATUS_LABELS.new;

  const handleFeedback = (rating: 'thumbs_up' | 'thumbs_down') => {
    feedbackMutation.mutate({ id: submission.id, rating });
  };

  const handleShare = () => {
    const text = `${submission.title}\n\n${submission.description}\n\nStatus: ${statusInfo.label}\nLocation: ${submission.location.latitude}, ${submission.location.longitude}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }} contentContainerClassName="pb-12">
      <View className="flex-row items-center gap-3 px-5 py-3 bg-white border-b border-gray-100">
        <Button title="" variant="ghost" icon="arrow-left" onPress={() => router.back()} size="sm" />
        <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {t('detail.title')}
        </Text>
        <TouchableOpacity onPress={handleShare} accessibilityLabel={t('detail.share')}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-5">
        <Card className="mb-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold text-gray-900">{submission.title}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Badge label={submission.category} color={CATEGORY_COLORS[submission.category] ?? '#6b7280'} />
                <Badge label={statusInfo.label} color={statusInfo.color} />
              </View>
            </View>
          </View>

          {submission.location && submission.location.latitude && (
            <View className="h-36 rounded-xl overflow-hidden mb-4 border border-gray-200">
              {Platform.OS !== 'web' ? (
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: submission.location.latitude,
                    longitude: submission.location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{
                    latitude: submission.location.latitude,
                    longitude: submission.location.longitude,
                  }} />
                </MapView>
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-100">
                  <MaterialCommunityIcons name="map-marker" size={32} color="#3b82f6" />
                  <Text className="text-xs text-gray-500 mt-1">
                    {submission.location.latitude.toFixed(4)}, {submission.location.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
              {submission.location.name && (
                <View className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-lg">
                  <Text className="text-xs text-gray-700">{submission.location.name}</Text>
                </View>
              )}
            </View>
          )}

          <Text className="text-sm text-gray-700 leading-6 mb-3">{submission.description}</Text>

          {submission.original_description && (
            <View className="bg-gray-50 rounded-xl p-3 mb-3">
              <Text className="text-xs text-gray-500 mb-1">
                {t('detail.translated_from', { language: submission.original_language ?? 'unknown' })}
              </Text>
              <Text className="text-sm text-gray-600 italic">{submission.original_description}</Text>
            </View>
          )}

          {submission.ai_summary && (
            <View className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <Text className="text-xs font-medium text-primary-700 mb-1">{t('detail.ai_summary')}</Text>
              <Text className="text-sm text-primary-800">{submission.ai_summary}</Text>
            </View>
          )}
        </Card>

        {submission.image_urls && submission.image_urls.length > 0 && (
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">{t('detail.media')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {submission.image_urls.map((url, idx) => (
                <Image
                  key={idx}
                  source={{ uri: url }}
                  className="w-28 h-28 rounded-xl bg-gray-200"
                />
              ))}
            </ScrollView>
            {submission.document_url && (
              <TouchableOpacity className="flex-row items-center gap-2 mt-3 py-2 px-3 bg-gray-50 rounded-lg">
                <MaterialCommunityIcons name="file-document-outline" size={16} color="#3b82f6" />
                <Text className="text-sm text-primary-600 font-medium">View Document</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">{t('detail.timeline')}</Text>
          {submission.timeline && submission.timeline.length > 0 ? (
            submission.timeline.map((event: TimelineEvent, idx: number) => {
              const iconName = TIMELINE_ICONS[event.icon] ?? 'clock-outline';
              const isLast = idx === submission.timeline!.length - 1;
              return (
                <View key={idx} className="flex-row">
                  <View className="items-center mr-3">
                    <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                      <MaterialCommunityIcons name={iconName} size={16} color="#3b82f6" />
                    </View>
                    {!isLast && <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </View>
                  <View className={`flex-1 pb-4 ${isLast ? '' : 'mb-1'}`}>
                    <Text className="text-sm font-medium text-gray-800">{event.label}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {new Date(event.date).toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text className="text-sm text-gray-400 italic">{t('detail.no_timeline')}</Text>
          )}
        </Card>

        {submission.status === 'resolved' && (
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-gray-800 mb-3">{t('detail.feedback')}</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_up')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${submission.feedback === 'thumbs_up' ? 'bg-success-50 border-success-500' : 'bg-white border-gray-200'}`}
              >
                <MaterialCommunityIcons name="thumb-up" size={20} color={submission.feedback === 'thumbs_up' ? '#16a34a' : '#6b7280'} />
                <Text className={`text-sm font-medium ${submission.feedback === 'thumbs_up' ? 'text-success-700' : 'text-gray-600'}`}>
                  {t('detail.thumbs_up')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_down')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${submission.feedback === 'thumbs_down' ? 'bg-danger-50 border-danger-500' : 'bg-white border-gray-200'}`}
              >
                <MaterialCommunityIcons name="thumb-down" size={20} color={submission.feedback === 'thumbs_down' ? '#dc2626' : '#6b7280'} />
                <Text className={`text-sm font-medium ${submission.feedback === 'thumbs_down' ? 'text-danger-700' : 'text-gray-600'}`}>
                  {t('detail.thumbs_down')}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
