import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { AnimatedBackground } from "../app/components/AnimatedBackground";

export function NoInternetOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Give the browser a brief moment to re-check connectivity
    await new Promise((r) => setTimeout(r, 800));
    if (navigator.onLine) {
      setIsOffline(false);
    }
    setIsRetrying(false);
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="no-internet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ isolation: "isolate" }}
        >
          {/* Blurred backdrop over whatever screen is below */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

          {/* Animated background particles — consistent with other screens */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatedBackground />
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="relative z-10 w-full max-w-md mx-4 bg-card/70 backdrop-blur-2xl border border-border rounded-[40px] p-10 shadow-2xl flex flex-col items-center text-center gap-6"
          >
            {/* Pulsing icon */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-24 h-24 rounded-full bg-red-500/10 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <WifiOff size={32} className="text-red-400" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                No Connection
              </h1>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                You appear to be offline. Moon Mafia needs a network connection to
                sync your game data and verify sessions.
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs font-bold text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              Waiting for connection…
            </div>

            {/* Retry button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95"
            >
              <RefreshCw size={16} className={isRetrying ? "animate-spin" : ""} />
              {isRetrying ? "Checking…" : "Retry Connection"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
