import { Category } from '@/src/types';

export const CATEGORIES: Category[] = [
  { id: 'roads', label_en: 'Roads & Transport', icon: 'Car' },
  { id: 'water', label_en: 'Water Supply', icon: 'Droplet' },
  { id: 'health', label_en: 'Health & Sanitation', icon: 'Hospital' },
  { id: 'education', label_en: 'Education', icon: 'BookOpen' },
  { id: 'electricity', label_en: 'Electricity', icon: 'Zap' },
  { id: 'sanitation', label_en: 'Sanitation & Waste', icon: 'Trash2' },
  { id: 'public_transport', label_en: 'Public Transport', icon: 'Bus' },
  { id: 'other', label_en: 'Other', icon: 'MoreHorizontal' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  roads: '#3b82f6',
  water: '#06b6d4',
  health: '#ef4444',
  education: '#a855f7',
  electricity: '#f59e0b',
  sanitation: '#22c55e',
  public_transport: '#6366f1',
  other: '#6b7280',
};
