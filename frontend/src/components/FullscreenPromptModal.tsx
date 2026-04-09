import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, X } from "lucide-react";


export function FullscreenPromptModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we already asked them this session
    const hasPrompted = sessionStorage.getItem("hasPromptedFullscreen");
    
    // Only show if not in fullscreen and not prompted yet
    if (!hasPrompted && !document.fullscreenElement) {
      // Small delay on page load before prompting
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = () => {
    sessionStorage.setItem("hasPromptedFullscreen", "true");
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("hasPromptedFullscreen", "true");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fullscreen-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9998] flex flex-col items-center justify-center pointer-events-auto"
          style={{ isolation: "isolate" }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm mx-4 bg-card/90 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center text-center gap-5"
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Maximize size={28} className="text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Play in Full Screen?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Moon Mafia is best experienced in full screen mode for maximum immersion.
              </p>
            </div>

            <button
              onClick={handleEnable}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              Enable Full Screen
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
