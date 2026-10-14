import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { CONFIG } from '@/src/constants/config';
import { useTranslation } from 'react-i18next';

interface MediaItem {
  uri: string;
  type: 'image' | 'document';
  name?: string;
}

interface MediaUploaderProps {
  images: MediaItem[];
  document: MediaItem | null;
  onAddImages: (items: MediaItem[]) => void;
  onRemoveImage: (index: number) => void;
  onSetDocument: (item: MediaItem | null) => void;
}

export function MediaUploader({
  images,
  document: doc,
  onAddImages,
  onRemoveImage,
  onSetDocument,
}: MediaUploaderProps) {
  const { t } = useTranslation();

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera roll access is needed to select photos.');
      return;
    }
    const remaining = CONFIG.MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Alert.alert('Limit Reached', t('submission.max_photos', { count: CONFIG.MAX_IMAGES }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((a) => ({
        uri: a.uri,
        type: 'image' as const,
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
      }));
      onAddImages(newImages);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
      return;
    }
    if (images.length >= CONFIG.MAX_IMAGES) {
      Alert.alert('Limit Reached', t('submission.max_photos', { count: CONFIG.MAX_IMAGES }));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const a = result.assets[0];
      onAddImages([{ uri: a.uri, type: 'image' as const, name: a.fileName ?? `photo_${Date.now()}.jpg` }]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const a = result.assets[0];
      onSetDocument({ uri: a.uri, type: 'document', name: a.name });
    }
  };

  const showImagePicker = () => {
    Alert.alert(t('submission.add_photos'), '', [
      { text: t('submission.take_photo'), onPress: takePhoto },
      { text: t('submission.choose_from_gallery'), onPress: pickImages },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {images.map((img, idx) => (
          <View key={idx} className="relative">
            <Image
              source={{ uri: img.uri }}
              className="w-20 h-20 rounded-xl bg-gray-200"
            />
            <TouchableOpacity
              onPress={() => onRemoveImage(idx)}
              className="absolute -top-2 -right-2 bg-gray-900/70 rounded-full p-1"
              accessibilityLabel="Remove image"
            >
              <MaterialCommunityIcons name="close" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < CONFIG.MAX_IMAGES && (
          <TouchableOpacity
            onPress={showImagePicker}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
            accessibilityLabel={t('submission.add_photos')}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {doc ? (
        <View className="flex-row items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#3b82f6" />
          <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
            {doc.name}
          </Text>
          <TouchableOpacity
            onPress={() => onSetDocument(null)}
            accessibilityLabel="Remove document"
          >
            <MaterialCommunityIcons name="close" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={pickDocument}
          className="flex-row items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
          accessibilityLabel={t('submission.add_document')}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#9ca3af" />
          <Text className="text-sm text-gray-500 font-medium">{t('submission.add_document')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
