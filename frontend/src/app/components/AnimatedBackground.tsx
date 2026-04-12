import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../../store/useSettingsStore";

export function AnimatedBackground() {
  const { highQuality } = useSettingsStore();

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
            key="hq-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('/photo/bg.webp')" }}
            />
          </motion.div>
        ) : (
          null
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-80 pointer-events-none" />
    </div>
  );
}
