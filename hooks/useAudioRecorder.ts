import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

/**
 * Custom hook to manage audio recording using expo-av.
 * Handles permissions, start/stop, playback, and exposes state for UI.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Start recording audio
  const startRecording = async () => {
    setError(null);
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      setError('Microphone permission is needed to record audio.');
      Alert.alert('Permission required', 'Microphone permission is needed to record audio.');
      return;
    }
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      
      // Use a format that's more compatible with Google Speech-to-Text
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      
      await rec.startAsync();
      setRecording(rec);
      recordingRef.current = rec;
      setIsRecording(true);
      setAudioUri(null);
    } catch (err) {
      setError('Failed to start recording.');
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  // Stop recording audio
  const stopRecording = async () => {
    setError(null);
    try {
      const rec = recordingRef.current;
      if (rec) {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        setAudioUri(uri || null);
        setRecording(null);
        recordingRef.current = null;
        setIsRecording(false);
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }
    } catch (err) {
      setError('Failed to stop recording.');
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Play back the recorded audio
  const playRecording = async () => {
    if (!audioUri) {
      setError('No recording to play.');
      return;
    }

    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setIsPlaying(true);
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (err) {
      setError('Failed to play recording.');
      setIsPlaying(false);
    }
  };

  // Stop playing the recorded audio
  const stopPlaying = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (err) {
      setError('Failed to stop playing.');
    }
  };

  // Reset audio state
  const reset = () => {
    setAudioUri(null);
    setError(null);
    setRecording(null);
    setIsRecording(false);
    setIsPlaying(false);
    recordingRef.current = null;
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  return {
    isRecording,
    audioUri,
    error,
    isPlaying,
    startRecording,
    stopRecording,
    playRecording,
    stopPlaying,
    reset,
  };
} 