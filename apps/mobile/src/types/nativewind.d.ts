import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
    size?: number | 'small' | 'large';
  }
  interface SwitchProps {
    className?: string;
  }
  interface RefreshControlProps {
    className?: string;
  }
  interface FlatListProps<T> {
    contentContainerClassName?: string;
  }
}

declare module 'react-native-maps' {
  interface MapViewProps {
    className?: string;
  }
  interface MarkerProps {
    className?: string;
  }
}

declare module 'expo-image' {
  interface ImageProps {
    className?: string;
  }
}
