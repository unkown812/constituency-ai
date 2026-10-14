import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  error?: string;
  readonly?: boolean;
  compact?: boolean;
}

export function LocationPicker({
  latitude,
  longitude,
  address,
  onLocationChange,
  error,
  readonly = false,
  compact = false,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [region, setRegion] = useState<Region>({
    latitude: latitude ?? 20.5937,
    longitude: longitude ?? 78.9629,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required. You can still drop a pin manually.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude: lat, longitude: lng } = loc.coords;
    setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }));
    const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const addr = geocode.length > 0
      ? [geocode[0].name, geocode[0].street, geocode[0].city, geocode[0].region]
          .filter(Boolean)
          .join(', ')
      : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onLocationChange(lat, lng, addr);
  };

  const handleMarkerDrag = async (lat: number, lng: number) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const addr = geocode.length > 0
        ? [geocode[0].name, geocode[0].street, geocode[0].city, geocode[0].region]
            .filter(Boolean)
            .join(', ')
        : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      onLocationChange(lat, lng, addr);
    } catch {
      onLocationChange(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const hasLocation = latitude !== null && longitude !== null;

  const mapHeight = compact ? 120 : 200;

  return (
    <View className="gap-2">
      {!readonly && (
        <TouchableOpacity
          onPress={getCurrentLocation}
          className="flex-row items-center gap-2 py-2.5 px-4 rounded-xl bg-primary-50 border border-primary-200"
          accessibilityLabel={t('submission.current_location')}
        >
          <MaterialCommunityIcons name="navigation" size={18} color="#3b82f6" />
          <Text className="text-sm font-medium text-primary-700">
            {t('submission.current_location')}
          </Text>
        </TouchableOpacity>
      )}

      {hasLocation ? (
        <View className={`rounded-xl overflow-hidden border border-gray-200`} style={{ height: mapHeight }}>
          {Platform.OS !== 'web' ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={!readonly}
              zoomEnabled={!readonly}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                draggable={!readonly}
                onDragEnd={(e) => {
                  const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                  handleMarkerDrag(lat, lng);
                }}
              />
            </MapView>
          ) : (
            <View className="flex-1 items-center justify-center bg-gray-100">
              <MaterialCommunityIcons name="map-marker" size={32} color="#3b82f6" />
              <Text className="text-xs text-gray-500 mt-1">{latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={getCurrentLocation}
          className="h-32 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
        >
          <MaterialCommunityIcons name="map-marker" size={32} color="#9ca3af" />
          <Text className="text-sm text-gray-500 mt-2 font-medium">{t('submission.select_location')}</Text>
        </TouchableOpacity>
      )}

      {address ? (
        <View className="flex-row items-start gap-2">
          <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
          <Text className="text-sm text-gray-500 flex-1">{address}</Text>
        </View>
      ) : null}

      {error && (
        <Text className="text-xs text-danger-500">{error}</Text>
      )}
    </View>
  );
}
