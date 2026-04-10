import { useNavigate } from "react-router";

import { motion } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";

export function CreditsScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 p-4 md:p-8 overflow-hidden transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start relative z-30"
      >
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
        >
          <ArrowLeftIcon size={14} />
          Back
        </button>
      </motion.div>
      <div className="flex-1 flex flex-col items-center justify-center relative z-20">
          <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 w-full max-w-5xl mx-auto px-4"
            >
              <div className="flex justify-center shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-125" />
                  <img
                    src="/photo/me.jpeg"
                    alt="Developer"
                    className="relative w-48 h-48 md:w-72 md:h-72 rounded-full object-cover border-4 border-emerald-500/30 shadow-2xl shadow-emerald-500/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("hidden");
                    }}
                  />
                  <div
                    hidden
                    className="relative w-48 h-48 md:w-72 md:h-72 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shadow-2xl"
                  >
                    <span className="text-7xl">🌙</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter mb-4 glow-emerald">Muaaz</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                  <span className="text-sm md:text-base font-bold text-emerald-400">
                    Developer
                  </span>
                  <span className="text-emerald-500/50 hidden md:inline">•</span>
                  <span className="text-sm md:text-base font-bold text-emerald-400">
                    Designer
                  </span>
                  <span className="text-emerald-500/50 hidden md:inline">•</span>
                  <span className="text-sm md:text-base font-bold text-emerald-400">
                    Strategist
                  </span>
                </div>
                
                <p className="text-sm md:text-base leading-relaxed md:leading-loose max-w-2xl mx-auto md:mx-0">
                  Moon Mafia is a solo project born out of a love for strategy, risk, and the thrill of
                  making the right call under pressure. Built from scratch as a local game experience,
                  every mechanic was designed to make each session feel high-stakes and rewarding.
                  Whether you're grinding mini-games or reading the market feed, there's always a play to be made.
                </p>

              </div>
            </motion.div>
      </div>
    </div>
  );
}
