import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES, CATEGORY_COLORS } from '@/src/constants/categories';

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

interface CategoryPickerProps {
  selected: string | null;
  onSelect: (categoryId: string) => void;
  error?: string;
}

export function CategoryPicker({ selected, onSelect, error }: CategoryPickerProps) {
  return (
    <View className="gap-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-1"
      >
        {CATEGORIES.map((cat) => {
          const iconName = iconMap[cat.icon] || 'dots-horizontal';
          const isSelected = selected === cat.id;
          const color = CATEGORY_COLORS[cat.id] ?? '#6b7280';
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              accessibilityRole="radio"
              accessibilityLabel={cat.label_en}
              accessibilityState={{ selected: isSelected }}
              className={`items-center gap-2 px-4 py-3 rounded-xl border-2 min-w-[80px] ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}
            >
              <MaterialCommunityIcons name={iconName} size={28} color={isSelected ? color : '#9ca3af'} />
              <Text
                className={`text-xs font-medium text-center ${isSelected ? 'text-primary-700' : 'text-gray-500'}`}
              >
                {cat.label_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {error && (
        <Text className="text-xs text-danger-500">{error}</Text>
      )}
    </View>
  );
}
