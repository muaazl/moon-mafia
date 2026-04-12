import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { FullScreenButton } from '../components/FullScreenButton';
import { playSound, playHaptic } from '../lib/audio';
import { useSettingsStore } from '../store/useSettingsStore';
import { NoInternetOverlay } from '../components/NoInternetOverlay';
import { MobileBlockerOverlay } from '../components/MobileBlockerOverlay';
import { FullscreenPromptModal } from '../components/FullscreenPromptModal';
import { AnimatedBackground } from './components/AnimatedBackground';
function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { musicEnabled } = useSettingsStore();
  const pendingPlay = useRef(true);
  const fadeIntervalRef = useRef<any>(null);
  const FADE_DURATION = 10000;
  const TARGET_VOLUME = 0.5;

  const fade = (targetVolume: number, duration: number, onComplete?: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    
    const audio = audioRef.current;
    if (!audio) return;

    const startVolume = audio.volume;
    const steps = 50;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, Math.min(TARGET_VOLUME, startVolume + (volumeStep * currentStep)));
      audio.volume = newVolume;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (onComplete) onComplete();
      }
    }, stepTime);
  };

  const startTrack = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    audio.volume = 0;
    try {
      await audio.play();
      fade(TARGET_VOLUME, FADE_DURATION);
    } catch {
      pendingPlay.current = true;
    }
  };

  useEffect(() => {
    const audio = new Audio('/music/bg.mp3');
    audio.loop = false;
    audio.volume = 0;
    audioRef.current = audio;

    const handleEnded = () => {
      setTimeout(() => {
        if (useSettingsStore.getState().musicEnabled) {
          startTrack();
        }
      }, 2000);
    };

    audio.addEventListener('ended', handleEnded);

    const interval = setInterval(() => {
      if (audio.duration && audio.currentTime > audio.duration - (FADE_DURATION / 1000)) {
        if (!fadeIntervalRef.current && audio.volume === TARGET_VOLUME) {
          fade(0, FADE_DURATION);
        }
      }
    }, 1000);

    const handleInteraction = () => {
      if (pendingPlay.current && useSettingsStore.getState().musicEnabled) {
        pendingPlay.current = false;
        startTrack();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    if (useSettingsStore.getState().musicEnabled) {
      startTrack();
    }

    return () => {
      clearInterval(interval);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.pause();
      audio.src = '';
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (musicEnabled) {
      if (audio.paused) startTrack();
    } else {
      fade(0, 2000, () => {
        audio.pause();
      });
    }
  }, [musicEnabled]);

  return null;
}

function GlobalAudioHaptics() {
  const lastHoveredRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        playSound('click');
        playHaptic('light');
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('button, a, [role="button"]') as HTMLElement;
      
      if (target) {
        if (lastHoveredRef.current !== target) {
          playSound('hover');
          lastHoveredRef.current = target;
        }
      } else {
        lastHoveredRef.current = null;
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return null;
}

function PerformanceWrapper({ children }: { children: React.ReactNode }) {
  const { highQuality } = useSettingsStore();
  return (
    <MotionConfig transition={highQuality ? undefined : { duration: 0 }}>
      <div className={highQuality ? "" : "perf-mode"}>
        {children}
      </div>
    </MotionConfig>
  );
}

function ZoomPreventer() {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')) {
        e.preventDefault();
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeydown, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="carrot" themes={['carrot', 'heart']}>
      <PerformanceWrapper>
        <ZoomPreventer />
        <BackgroundMusic />
        <GlobalAudioHaptics />
        <AnimatedBackground />
        <div style={{ minWidth: '1280px', minHeight: '800px', width: '100%', height: '100%' }}>
          <RouterProvider router={router} />
          <MobileBlockerOverlay />
          <FullscreenPromptModal />
          <NoInternetOverlay />
          <Toaster />
          <FullScreenButton />
        </div>
      </PerformanceWrapper>
    </ThemeProvider>
  );
}
