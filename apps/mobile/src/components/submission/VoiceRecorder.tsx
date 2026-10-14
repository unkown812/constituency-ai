import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string) => void;
  onTranscriptResult?: (text: string) => void;
}

export function VoiceRecorder({ onRecordingComplete, onTranscriptResult }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setRecordedUri(uri);
        onRecordingComplete(uri);
      }
      setRecording(null);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const clearRecording = () => {
    setRecordedUri(null);
    setDuration(0);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View className="gap-3">
      {isRecording ? (
        <TouchableOpacity
          onPress={stopRecording}
          className="flex-row items-center justify-center gap-3 py-4 rounded-xl bg-danger-500"
          accessibilityLabel={t('submission.stop_recording')}
        >
          <MaterialCommunityIcons name="stop" size={20} color="#fff" />
          <Text className="text-white font-semibold">
            {t('submission.recording')} ({formatDuration(duration)})
          </Text>
        </TouchableOpacity>
      ) : recordedUri ? (
        <View className="flex-row items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">
          <MaterialCommunityIcons name="play" size={20} color="#3b82f6" />
          <Text className="text-sm text-gray-600 flex-1">
            Recording ({formatDuration(duration)})
          </Text>
          <TouchableOpacity onPress={clearRecording} accessibilityLabel={t('submission.record_again')}>
            <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity onPress={startRecording} accessibilityLabel={t('submission.record_again')}>
            <Text className="text-primary-500 text-sm font-medium">{t('submission.record_again')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={startRecording}
          className="flex-row items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
          accessibilityLabel={t('submission.start_recording')}
        >
          <MaterialCommunityIcons name="microphone" size={20} color="#9ca3af" />
          <Text className="text-sm text-gray-500 font-medium">{t('submission.voice_input')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
