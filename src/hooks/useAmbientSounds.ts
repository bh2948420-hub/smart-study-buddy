import { useState, useRef, useCallback, useEffect } from 'react';

export type SoundType = 'rain' | 'cafe' | 'nature' | 'fireplace' | 'whitenoise';

interface AmbientSound {
  id: SoundType;
  name: string;
  nameAr: string;
  url: string;
  icon: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    nameAr: 'مطر',
    url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112181b.mp3',
    icon: '🌧️',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    nameAr: 'مقهى',
    url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_a89eb65b2d.mp3',
    icon: '☕',
  },
  {
    id: 'nature',
    name: 'Nature',
    nameAr: 'طبيعة',
    url: 'https://cdn.pixabay.com/audio/2022/02/07/audio_1d2460c4e8.mp3',
    icon: '🌿',
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    nameAr: 'موقد',
    url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_96e5f3a00e.mp3',
    icon: '🔥',
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    nameAr: 'ضوضاء بيضاء',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_2dde668d05.mp3',
    icon: '📻',
  },
];

export const useAmbientSounds = () => {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundType: SoundType) => {
    const sound = AMBIENT_SOUNDS.find((s) => s.id === soundType);
    if (!sound) return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio
    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    
    audio.play().then(() => {
      setActiveSound(soundType);
      setIsPlaying(true);
    }).catch(console.error);
  }, [volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveSound(null);
    setIsPlaying(false);
  }, []);

  const toggleSound = useCallback((soundType: SoundType) => {
    if (activeSound === soundType && isPlaying) {
      stopSound();
    } else {
      playSound(soundType);
    }
  }, [activeSound, isPlaying, playSound, stopSound]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    activeSound,
    volume,
    isPlaying,
    sounds: AMBIENT_SOUNDS,
    playSound,
    stopSound,
    toggleSound,
    updateVolume,
  };
};
