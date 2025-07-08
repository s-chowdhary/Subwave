import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAudioWithGoogle } from './services/speechToText';
import * as Speech from 'expo-speech';

export default function App() {
  console.log('App component is loading!');
  
  // Use the custom audio recorder hook
  const {
    isRecording,
    audioUri,
    error,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const [transcription, setTranscription] = React.useState<string>('');
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('Audio State Debug:', {
      isRecording,
      audioUri: audioUri ? 'exists' : 'null',
      isTranscribing,
      transcription: transcription ? 'exists' : 'empty',
      error
    });
  }, [isRecording, audioUri, isTranscribing, transcription, error]);

  // Transcribe audio when recording stops
  React.useEffect(() => {
    if (audioUri && !isRecording && !transcription) {
      console.log('Starting transcription...');
      setIsTranscribing(true);
      transcribeAudioWithGoogle(audioUri)
        .then((text: string) => {
          console.log('Transcription result:', text);
          setTranscription(text);
        })
        .catch((err: any) => {
          console.error('Transcription error:', err);
          setTranscription('(Transcription error)');
        })
        .finally(() => setIsTranscribing(false));
    }
  }, [audioUri, isRecording, transcription]);

  // Reset states when starting new recording
  React.useEffect(() => {
    if (isRecording) {
      console.log('Resetting states for new recording');
      setTranscription('');
    }
  }, [isRecording]);

  // Toggle recording state
  const handleToggleListening = () => {
    if (!isRecording) {
      console.log('Starting recording...');
      startRecording();
    } else {
      console.log('Stopping recording...');
      stopRecording();
    }
  };

  // Play transcription using TTS
  const handleSpeak = () => {
    if (transcription) {
      Speech.speak(transcription, {
        rate: 1.0,
        pitch: 1.0,
        onDone: () => {},
        onError: () => {},
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚇 Subwave</Text>
        <Text style={styles.subtitle}>Subway Announcement Transcriber</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recording Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📝 Recording Tips</Text>
          <Text style={styles.tipText}>• Speak clearly and loudly</Text>
          <Text style={styles.tipText}>• Record for at least 3-5 seconds</Text>
          <Text style={styles.tipText}>• Minimize background noise</Text>
          <Text style={styles.tipText}>• Hold phone close to your mouth</Text>
        </View>

        {/* Main Recording Button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive
          ]}
          onPress={handleToggleListening}
          activeOpacity={0.8}
        >
          <View style={styles.recordButtonContent}>
            <View style={[
              styles.recordIcon,
              isRecording && styles.recordIconActive
            ]}>
              {isRecording ? (
                <Text style={styles.recordIconText}>⏹️</Text>
              ) : (
                <Text style={styles.recordIconText}>🎤</Text>
              )}
            </View>
            <Text style={styles.recordButtonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Status Display */}
        <View style={styles.statusContainer}>
          {isTranscribing ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.statusText}>Transcribing audio...</Text>
            </View>
          ) : transcription ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>📢 Announcement:</Text>
              <Text style={styles.transcriptionText}>{transcription}</Text>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={handleSpeak}
                activeOpacity={0.8}
              >
                <Text style={styles.speakButtonText}>🔊 Play Announcement</Text>
              </TouchableOpacity>
            </View>
          ) : isRecording ? (
            <View style={styles.statusBox}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.statusText}>Recording...</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Press Start to begin recording</Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tipsContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 6,
    lineHeight: 20,
  },
  recordButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  recordButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordIconText: {
    fontSize: 20,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 8,
  },
  secondaryButtonActive: {
    backgroundColor: '#FF9500',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hintText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  speakButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
  },
  speakButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
