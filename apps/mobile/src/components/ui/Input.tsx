import { View, TextInput, Text, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  icon: iconName,
  containerClassName = '',
  className = '',
  ...props
}: InputProps) {
  return (
    <View className={`gap-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View className="flex-row items-center gap-2">
        {iconName && (
          <View className="absolute left-3 z-10">
            <MaterialCommunityIcons name={iconName} size={18} color="#9ca3af" />
          </View>
        )}
        <TextInput
          className={`flex-1 border rounded-xl px-4 py-3.5 text-base text-gray-900 bg-white ${iconName ? 'pl-10' : ''} ${error ? 'border-danger-500' : 'border-gray-300'} ${className}`}
          placeholderTextColor="#9ca3af"
          accessibilityLabel={label ?? props.placeholder}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-xs text-danger-500 mt-0.5">{error}</Text>
      )}
    </View>
  );
}
