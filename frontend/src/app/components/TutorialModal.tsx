import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dotted-dialog";

interface Slide {
  title: string;
  description: string;
  image: string; // Placeholder for screenshots
  instructions: string[];
}

const TUTORIAL_SLIDES: Slide[] = [
  {
    title: "THE MARKET",
    description: "Welcome to the Moon Mafia. The market is volatile and fast.",
    image: "/tutorials/market.png",
    instructions: [
      "Watch the feed closely.",
      "Hearts and Carrots appear briefly before fading.",
      "Your eyes are your best tool."
    ]
  },
  {
    title: "THE SPREAD",
    description: "Volatility means opportunity. High risk, high reward.",
    image: "/tutorials/spread.png",
    instructions: [
      "Smaller differences between counts mean higher payouts.",
      "The spread determines your risk level.",
      "Predict correctly to multiply your capital."
    ]
  },
  {
    title: "ACTIONS: HYPE & PURGE",
    description: "Choose your side. Are you feeling bullish or bearish?",
    image: "/tutorials/actions.png",
    instructions: [
      "HYPE: Wager that Hearts outnumber Carrots.",
      "PURGE: Wager that Carrots outnumber Hearts.",
      "BET: Predict the exact Heart count for massive multipliers."
    ]
  },
  {
    title: "SIDE HUSTLES",
    description: "Gamble, Hunt, Fish. Diversify your capital sources.",
    image: "/tutorials/side-hustles.png",
    instructions: [
      "GAMBLE: High-stakes ratio betting.",
      "HUNT & FISH: Go off-grid to earn capital.",
      "LOANS: Need a boost? Take a loan, but beware the payback."
    ]
  }
];

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export function TutorialModal({ open, onClose, onFinish }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = TUTORIAL_SLIDES[currentSlide];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-dashed">
        <div className="relative flex flex-col h-[500px]">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-50">
            <motion.div
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentSlide + 1) / TUTORIAL_SLIDES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Image Placeholder */}
            <div className="flex-1 bg-black/40 relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-white/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full flex items-center justify-center p-8"
                >
                  <div className="w-full h-full rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center overflow-hidden group">
                    <img 
                      src={slide.image} 
                      alt={slide.title} 
                      className="w-full h-full object-cover transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="flex flex-col items-center justify-center text-center p-6">
                            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                              <span class="text-emerald-400 font-bold">${currentSlide + 1}</span>
                            </div>
                            <p class="text-xs text-emerald-400/60 tracking-wider font-black mb-2">Image Not Found</p>
                            <p class="text-xs text-muted-foreground font-medium tracking-wider">${slide.image}</p>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 pointer-events-none" />
            </div>

            {/* Text Area */}
            <div className="flex-1 p-8 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  <h2 className="text-2xl font-black text-foreground tracking-tighter glow-emerald mb-2">
                    {slide.title}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed">
                    {slide.description}
                  </p>

                  <div className="space-y-4">
                    {slide.instructions.map((inst, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        className="flex gap-3 items-start"
                      >
                        <div className="mt-1 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        <p className="text-sm font-bold text-foreground/80 leading-relaxed">
                          {inst}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-auto pt-8">
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentSlide === 0}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all rounded-lg"
                  >
                    {currentSlide === TUTORIAL_SLIDES.length - 1 ? (
                      <>Finish <Check size={14} /></>
                    ) : (
                      <>Next <ChevronRight size={14} /></>
                    )}
                  </button>
                </div>

                <button
                  onClick={onFinish}
                  className="text-xs font-bold text-muted-foreground hover:text-red-400 tracking-wider transition-colors"
                >
                  Skip Tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
