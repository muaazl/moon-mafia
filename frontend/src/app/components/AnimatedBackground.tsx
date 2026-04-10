import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useState } from "react";

export function AnimatedBackground() {
  const { highQuality } = useSettingsStore();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {!highQuality && (
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      )}
      <AnimatePresence mode="wait">
        {highQuality ? (
          <motion.div
            key="mp4-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <video
              src="/video/bg-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              onCanPlay={() => setIsVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transform-gpu transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 transition-opacity duration-500">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 animate-pulse">Loading High Quality Mode...</span>
              </div>
            )}
          </motion.div>
        ) : (
          null
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80 pointer-events-none" />
    </div>
  );
}
