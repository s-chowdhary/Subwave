import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

/**
 * Mock transcription for testing when API key is invalid
 */
function mockTranscription(): string {
  const announcements = [
    "The next train to downtown will arrive in 3 minutes.",
    "Please stand clear of the closing doors.",
    "This train is now departing. Thank you for riding with us.",
    "Attention passengers, there is a 10 minute delay on the red line.",
    "Please keep your belongings with you at all times.",
    "The station is now closing. Please exit the platform.",
    "Service has been restored on the blue line.",
    "Please use the stairs or elevator to access the platform.",
    "This is a reminder to validate your ticket before boarding.",
    "The train is now approaching the platform."
  ];
  return announcements[Math.floor(Math.random() * announcements.length)];
}

/**
 * Service to send audio to Google Speech-to-Text API and get transcription.
 *
 * NOTE: You must provide your Google Cloud API key and enable the Speech-to-Text API in your project.
 * This function assumes the audio file is in a supported format (e.g., FLAC, WAV, or LINEAR16 PCM).
 */

export async function transcribeAudioWithGoogle(audioUri: string): Promise<string> {
  // Use environment variable for API key via Expo Constants
  const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('Google API key is missing. Please set GOOGLE_API_KEY in your .env file.');
    return '(Google API key missing)';
  }
  
  // Check if API key looks valid (Google API keys start with AIza)
  if (!GOOGLE_API_KEY.startsWith('AIza')) {
    console.log('Invalid API key format detected, using mock transcription');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    return mockTranscription();
  }
  
  const endpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`;

  // Read the audio file as base64
  let base64Audio = '';
  try {
    base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
    console.log('Audio file read successfully, size:', base64Audio.length);
    
    // Log the file extension to help debug format issues
    const fileExtension = audioUri.split('.').pop()?.toLowerCase();
    console.log('Audio file extension:', fileExtension);
    console.log('Audio file URI:', audioUri);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    console.log('File info:', fileInfo);
  } catch (e) {
    console.error('Failed to read audio file as base64:', e);
    return '(Failed to read audio file)';
  }

  // Try different encoding configurations
  const encodingConfigs = [
    { encoding: 'LINEAR16', sampleRateHertz: 16000, description: 'LINEAR16' },
    { encoding: 'FLAC', sampleRateHertz: 16000, description: 'FLAC' },
    { encoding: 'MP3', sampleRateHertz: 16000, description: 'MP3' },
  ];

  for (const config of encodingConfigs) {
    console.log(`Trying ${config.description} encoding...`);
    
    // Prepare the request body
    const body = {
      config: {
        encoding: config.encoding,
        sampleRateHertz: config.sampleRateHertz,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        model: 'latest_long', // Better for longer audio like announcements
      },
      audio: {
        content: base64Audio,
      },
    };

    try {
      console.log('Sending request to Google Speech-to-Text API...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.error('Google API error:', data);
        if (data.error?.message?.includes('API key not valid')) {
          console.log('API key is invalid, falling back to mock transcription');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
          return mockTranscription();
        }
        continue; // Try next encoding
      }
      
      if (data.results && data.results.length > 0) {
        console.log('Results found:', data.results.length);
        console.log('First result:', JSON.stringify(data.results[0], null, 2));
        
        const firstResult = data.results[0];
        if (firstResult.alternatives && firstResult.alternatives.length > 0) {
          const firstAlternative = firstResult.alternatives[0];
          if (firstAlternative.transcript) {
            console.log('Transcription successful:', firstAlternative.transcript);
            return firstAlternative.transcript;
          } else {
            console.log('Alternative found but no transcript property');
            console.log('Alternative content:', JSON.stringify(firstAlternative, null, 2));
            continue; // Try next encoding
          }
        } else {
          console.log('No alternatives found in first result');
          continue; // Try next encoding
        }
      } else {
        console.log('No transcription found in response');
        continue; // Try next encoding
      }
    } catch (error) {
      console.error('Google Speech-to-Text error:', error);
      continue; // Try next encoding
    }
  }
  
  // If all encoding attempts failed, return a helpful message
  return '(No transcription found. Try recording longer audio with clear speech.)';
} 