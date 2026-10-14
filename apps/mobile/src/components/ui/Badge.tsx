import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  className?: string;
}

export function Badge({ label, color = '#6b7280', className = '' }: BadgeProps) {
  return (
    <View
      className={`self-start px-2.5 py-1 rounded-full ${className}`}
      style={{ backgroundColor: `${color}20` }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
