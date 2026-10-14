import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/src/stores/language-store';
import { LANGUAGES } from '@/src/constants/languages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  const handleSelect = async (code: string) => {
    await changeLanguage(code);
    router.back();
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-8 pb-4">
        <Text className="text-2xl font-bold text-gray-900">{t('language.title')}</Text>
        <Text className="text-sm text-gray-500 mt-1">{t('language.subtitle')}</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        {LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              className={`flex-row items-center justify-between py-4 px-4 rounded-xl mb-2 ${isSelected ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 border border-gray-100'}`}
              accessibilityRole="radio"
              accessibilityLabel={lang.name_en}
              accessibilityState={{ selected: isSelected }}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-lg">{lang.name_native}</Text>
                <Text className="text-sm text-gray-400">({lang.name_en})</Text>
              </View>
              {isSelected && <MaterialCommunityIcons name="check" size={20} color="#3b82f6" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
