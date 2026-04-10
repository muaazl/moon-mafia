import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MonitorX } from "lucide-react";


export function MobileBlockerOverlay() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      if (isMobileDevice) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <AnimatePresence>
      {isMobile && (
        <motion.div
          key="mobile-blocker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 text-center"
          style={{ isolation: "isolate" }}
        >
          <div className="absolute inset-0 bg-background/95 backdrop-blur-2xl" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50">

          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 flex flex-col items-center max-w-sm gap-6"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <MonitorX size={40} className="text-red-400" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                Desktop Only
              </h1>
              <p className="text-base text-muted-foreground font-medium leading-relaxed">
                Moon Mafia is a desktop game. Please visit this website from your computer to play.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
