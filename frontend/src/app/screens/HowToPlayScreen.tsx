import { useNavigate } from "react-router";


import { motion, Variants } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";

export function HowToPlayScreen() {
  const navigate = useNavigate();


  const actions = [
    { title: "HYPE", desc: "Wager that Hearts outnumber Carrots. Payouts scale with the market's volatility." },
    { title: "PURGE", desc: "Wager that Carrots outnumber Hearts. Payouts scale with the market's volatility." },
    { title: "BET", desc: "Predict the exact Heart count for massive multipliers. Extreme risk, extreme reward." },
  ];

  const miniGames = [
    { title: "GAMBLE", desc: "High-stakes ratio betting based on real-time market spreads." },
    { title: "HUNT & FISH", desc: "Go off-grid to earn capital. Higher risks yield bigger trophies." },
    { title: "LOAN", desc: "Need a boost? Take a loan now, but you'll owe double on the payback." },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 p-4 md:p-8 overflow-x-hidden transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start relative z-20"
      >
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all tracking-wider text-sm font-bold"
        >
          <ArrowLeftIcon size={14} />
          Back
        </button>
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full mt-4 md:mt-0 relative z-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 glow-emerald">
            How to Play
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Learn the rules of the game before you start playing!
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
          <div className="space-y-6">
            <h2 className="text-base font-bold text-emerald-400 mb-6 flex items-center gap-3">
              <span className="h-4 w-1 bg-emerald-500 rounded-full" /> Actions
            </h2>
            <div className="grid gap-4">
              {actions.map((t) => (
                <div key={t.title} className="bg-card/40 border border-border/50 rounded-2xl p-4 transition-colors">
                  <h4 className="text-sm font-bold text-foreground mb-1">{t.title}</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-base font-bold text-emerald-400 mb-6 flex items-center gap-3">
              <span className="h-4 w-1 bg-emerald-500 rounded-full" /> Side Hustles
            </h2>
            <div className="grid gap-4">
              {miniGames.map((t) => (
                <div key={t.title} className="bg-card/40 border border-border/50 rounded-2xl p-4 transition-colors">
                  <h4 className="text-sm font-bold text-foreground mb-1">{t.title}</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card/40 rounded-3xl p-6 border border-border/50 shadow-sm flex flex-col">
            <h2 className="text-base font-bold text-emerald-400 mb-6 flex items-center gap-3">
              <span className="h-4 w-1 bg-emerald-500 rounded-full" /> Operational Rules
            </h2>
            <div className="space-y-4">
              {[
                "1. Classic: Survive 10 rounds with positive capital to rank.",
                "2. Unlimited: High stakes, faster fades, and scaling difficulty.",
                "3. Stake Limit: Max 50% of your balance can be wagered per round.",
                "4. Hints: Use 'Reveal Hint' to see the feed for 3 seconds (costs capital)."
              ].map(rule => (
                <div key={rule} className="flex gap-3 items-start border-b border-white/5 pb-2 last:border-0">
                  <p className="text-xs font-bold text-foreground/80 leading-relaxed flex-1">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}