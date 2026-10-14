import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { CategoryPicker } from '@/src/components/submission/CategoryPicker';
import { MediaUploader } from '@/src/components/submission/MediaUploader';
import { LocationPicker } from '@/src/components/submission/LocationPicker';
import { VoiceRecorder } from '@/src/components/submission/VoiceRecorder';
import { useCreateSubmission, useUploadFile } from '@/src/hooks/useSubmissions';
import { CONFIG } from '@/src/constants/config';

const formSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z
    .string()
    .min(CONFIG.SUBMISSION_DESCRIPTION_MIN_LENGTH, 'Description must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface MediaItem {
  uri: string;
  type: 'image' | 'document';
  name?: string;
}

const STEPS = ['category', 'description', 'location', 'review'] as const;
type Step = (typeof STEPS)[number];

export default function NewSubmissionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { category: preselectedCategory } = useLocalSearchParams<{ category?: string }>();
  const createSubmission = useCreateSubmission();

  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [document, setDocument] = useState<MediaItem | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: preselectedCategory ?? '',
      description: '',
    },
  });

  const selectedCategory = watch('category');
  const description = watch('description');

  const canProceed = () => {
    const step = STEPS[currentStep];
    if (step === 'category') return !!selectedCategory;
    if (step === 'description') return description.length >= CONFIG.SUBMISSION_DESCRIPTION_MIN_LENGTH;
    if (step === 'location') return latitude !== null && longitude !== null;
    return true;
  };

  const nextStep = () => {
    const step = STEPS[currentStep];
    if (step === 'category' && !selectedCategory) {
      return;
    }
    if (step === 'description' && description.length < CONFIG.SUBMISSION_DESCRIPTION_MIN_LENGTH) {
      return;
    }
    if (step === 'location' && (latitude === null || longitude === null)) {
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const descriptionText = transcript || description;
      await createSubmission.mutateAsync({
        category: selectedCategory,
        description: descriptionText,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        address: address || undefined,
      });
      Alert.alert(t('submission.success'), '', [
        { text: t('common.ok'), onPress: () => router.replace('/(tabs)/submissions') },
      ]);
    } catch (err: any) {
      Alert.alert(t('submission.error'), err?.response?.data?.detail ?? err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step) {
      case 'category':
        return (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-gray-800">{t('submission.category')}</Text>
            <Controller
              control={control}
              name="category"
              render={() => (
                <CategoryPicker
                  selected={selectedCategory}
                  onSelect={(cat) => setValue('category', cat)}
                  error={errors.category?.message}
                />
              )}
            />
          </View>
        );

      case 'description':
        return (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-gray-800">{t('submission.description')}</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label=""
                  placeholder={t('submission.description_placeholder')}
                  value={transcript || value}
                  onChangeText={(text) => {
                    onChange(text);
                    setTranscript('');
                  }}
                  multiline
                  numberOfLines={5}
                  className="min-h-[120px] text-base leading-5"
                  error={errors.description?.message}
                  containerClassName="mb-2"
                />
              )}
            />
            <VoiceRecorder
              onRecordingComplete={setVoiceUri}
              onTranscriptResult={setTranscript}
            />
          </View>
        );

      case 'location':
        return (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-gray-800">{t('submission.select_location')}</Text>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              address={address}
              onLocationChange={(lat, lng, addr) => {
                setLatitude(lat);
                setLongitude(lng);
                if (addr) setAddress(addr);
              }}
              error={latitude === null ? t('submission.location_required') : undefined}
            />
          </View>
        );

      case 'review':
        return (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-gray-800">{t('submission.review_submit')}</Text>

            <View className="bg-white rounded-xl p-4 border border-gray-100 gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">{t('submission.category')}</Text>
                <Text className="text-sm font-medium text-gray-800">{selectedCategory}</Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View>
                <Text className="text-sm text-gray-500 mb-1">{t('submission.description')}</Text>
                <Text className="text-sm text-gray-800" numberOfLines={3}>
                  {transcript || description}
                </Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">{t('submission.attachments')}</Text>
                <Text className="text-sm text-gray-800">
                  {images.length > 0 ? `${images.length} photos` : t('submission.no_images')}
                  {document ? `, 1 doc` : ''}
                  {voiceUri ? ', voice' : ''}
                </Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View>
                <Text className="text-sm text-gray-500 mb-1">{t('submission.location')}</Text>
                <Text className="text-sm text-gray-800" numberOfLines={1}>
                  {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  {address ? ` - ${address}` : ''}
                </Text>
              </View>
            </View>

            <Button
              title={isSubmitting ? t('submission.submitting') : t('submission.submit')}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              icon="check"
              size="lg"
              className="mt-2"
            />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <Button title="" variant="ghost" icon="arrow-left" onPress={prevStep} size="sm" />
          <Text className="text-lg font-semibold text-gray-900">{t('submission.new')}</Text>
        </View>
        <Text className="text-sm text-gray-400">
          {t('submission.steps', { current: currentStep + 1, total: STEPS.length })}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="flex-row h-1 bg-gray-200">
        {STEPS.map((_, idx) => (
          <View
            key={idx}
            className={`flex-1 ${idx <= currentStep ? 'bg-primary-500' : 'bg-gray-200'}`}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-32"
      >
        {renderStep()}

        {currentStep < STEPS.length - 1 && (
          <Button
            title={t('common.next')}
            onPress={nextStep}
            disabled={!canProceed()}
            className="mt-8"
            size="lg"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
