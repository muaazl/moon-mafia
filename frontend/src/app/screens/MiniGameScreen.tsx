import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { api } from "../../lib/api";
import { MiniResponse } from "../../lib/types";
import { useAuthStore } from "../../store/useAuthStore";
import { ArrowLeftIcon } from "lucide-react";
import { API_ROUTES, UI_MESSAGES } from "../../lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dotted-dialog";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "../components/ui/drawer";
import { playSound, playHaptic } from "../../lib/audio";

type MiniGameId = "gamble" | "beg" | "search" | "fish" | "hunt" | "loan";

const MINI_GAMES: { id: MiniGameId; label: string; tagline: string }[] = [
  { id: "gamble", label: "Gamble",  tagline: "Win big or lose it all. 3 shots before cooldown." },
  { id: "beg",    label: "Beg",     tagline: "Easy money — a bit embarrassing. 2 shots." },
  { id: "search", label: "Search",  tagline: "Look around for some spare change. 2 shots." },
  { id: "fish",   label: "Fish",    tagline: "Relax and wait for a bite. 2 shots." },
  { id: "hunt",   label: "Hunt",    tagline: "Go after the bigger prizes. 2 shots." },
  { id: "loan",   label: "Loan",    tagline: "Take a quick $100–$500 loan. Pay back double." },
];

const copyToClipboard = (value: number) => {
  navigator.clipboard.writeText(value.toString()).then(() => {
    toast.success("Copied!", { description: `$${value.toLocaleString()} copied to clipboard.` });
  });
};

// ─── Component ────────────────────────────────────────────────────────────────
export function MiniGameScreen() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const [selectedGame, setSelectedGame] = useState<MiniGameId>("gamble");
  const [betAmount, setBetAmount] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [outcome, setOutcome] = useState<{
    type: "win" | "loss" | "neutral";
    detail: string;
    earned: number;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBustModal, setShowBustModal] = useState(false);

  // ── Cooldowns & Local State ──────────────────────────────────────────────
  const [cooldowns, setCooldowns] = useState<Record<string, string>>({});
  const [loanBalance, setLoanBalance] = useState<number>(0);

  // Countdown cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [key, msg] of Object.entries(next)) {
          if (!msg) continue;
          const match = msg.match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > 1) {
              next[key] = msg.replace(/\d+/, (num - 1).toString());
              changed = true;
            } else {
              delete next[key];
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const WIN_OUTCOMES     = new Set(["WIN", "SUCCESS", "RECEIVED", "FOUND", "CATCH", "TROPHY", "BIG_WIN", "LOAN"]);
  const NEUTRAL_OUTCOMES = new Set(["EMPTY", "REJECTED", "DRAW"]);

  const SUSPENSE_DELAY_MS = 1500;

  const handlePlay = async () => {
    if (selectedGame === "gamble") {
      const amount = parseFloat(betAmount);
      if (!amount || amount <= 0) {
        const msg = UI_MESSAGES.MINI.BET_REQUIRED;
        toast(msg.title, { description: msg.description });
        return;
      }
    }

    setIsRunning(true);
    setOutcome(null);
    const prevCapital = user?.capital ?? 0;

    try {
      let response;
      if (selectedGame === "gamble") {
        response = await api.post<MiniResponse>(API_ROUTES.MINI.GAMBLE, { amount: parseFloat(betAmount) });
      } else {
        response = await api.post<MiniResponse>(API_ROUTES.MINI.PLAY(selectedGame));
      }

      // Immediately update store so funds display changes right away
      await refreshUser();

      const { data } = response;
      const earned = Math.round((data.capital - prevCapital) * 100) / 100;

      const outcomeType = WIN_OUTCOMES.has(data.outcome)
        ? "win"
        : NEUTRAL_OUTCOMES.has(data.outcome)
          ? "neutral"
          : "loss";

      // Keep the loading screen up a bit longer to build suspense
      await new Promise((resolve) => setTimeout(resolve, SUSPENSE_DELAY_MS));

      setIsRunning(false);
      setOutcome({ type: outcomeType, detail: data.detail, earned });

      // Track loan amount taken
      if (selectedGame === "loan" && outcomeType === "win" && earned > 0) {
        setLoanBalance((prev) => prev + earned);
      }

      if (outcomeType === "win") {
        playSound("miniwin");
        playHaptic("medium");
      } else if (outcomeType === "loss") {
        playSound("minilose");
        playHaptic("heavy");
      }

      setCooldowns((prev) => ({ ...prev, [selectedGame]: "" }));

    } catch (error: any) {
      setIsRunning(false);
      if (error.response?.status === 429) {
        // Backend says we must wait
        const detail = error.response.data.detail;
        setCooldowns((prev) => ({ ...prev, [selectedGame]: detail }));
        const msg = UI_MESSAGES.MINI.COOLDOWN(detail);
        toast.error(msg.title, { description: msg.description });
      } else {
        const detail = error.response?.data?.detail || "Something went wrong.";
        const msg = UI_MESSAGES.MINI.FAILED(detail);
        toast.error(msg.title, { description: msg.description });
      }
    }
  };

  const handlePaybackLoan = async () => {
    if (loanBalance <= 0) return;
    const repayAmount = loanBalance * 2;
    const currentCapital = user?.capital ?? 0;
    if (currentCapital < repayAmount) {
      const msg = UI_MESSAGES.MINI.PAYBACK_INSUFFICIENT(repayAmount, currentCapital);
      toast.error(msg.title, { description: msg.description });
      return;
    }
    try {
      const clearedAmount = loanBalance;
      await api.post(API_ROUTES.MINI.PAYBACK, { amount: repayAmount });
      setLoanBalance(0);
      await refreshUser();
      const msg = UI_MESSAGES.MINI.PAYBACK_SUCCESS(repayAmount, clearedAmount);
      toast.success(msg.title, { description: msg.description });
    } catch (error: any) {
      const detail = error.response?.data?.detail || "Payback failed";
      const msg = UI_MESSAGES.MINI.FAILED(detail);
      toast.error(msg.title, { description: msg.description });
    }
  };

  const capitalValue = user?.capital ?? 0;
  const capitalIsNegative = capitalValue < 0;

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 p-4 md:p-8 overflow-x-hidden transition-colors duration-500">
      <AnimatedBackground />

      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start relative z-20"
      >
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
        >
          <ArrowLeftIcon size={14} />
          Back
        </button>

        <div className="relative flex flex-col items-end text-right min-w-[200px] group">
          {/* Artistic Avatar Overlay - Half Visible/Half Hidden */}
          {user?.avatar_url && (
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full overflow-hidden opacity-20 grayscale pointer-events-none blur-[2px] transition-all duration-700">
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover scale-110" />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-end mb-2">
            <span className="text-2xl font-black text-foreground tracking-tighter glow-emerald leading-none">{user?.name || "Player"}</span>
          </div>

          <div className="relative z-10 flex flex-col items-end">
            <span className="text-sm font-bold text-muted-foreground opacity-60 mb-1">Available Funds</span>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={`text-xl font-black tracking-tight copyable ${
                  capitalIsNegative ? "text-red-400 glow-red" : "text-emerald-400 glow-emerald"
                }`}
                onClick={() => copyToClipboard(capitalValue)}
                title="Click to copy"
              >
                {capitalIsNegative ? "-" : ""}${Math.abs(capitalValue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full mt-4 md:mt-0 relative z-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 glow-emerald">
            Mini Games
          </h1>
          <p className="text-sm text-muted-foreground font-bold">
            Play back-to-back — then wait out the cooldown.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex max-w-5xl w-full gap-8">
          {/* Left: mini-games list */}
          <div className="w-[320px] shrink-0 rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
            <div className="space-y-3">
              {MINI_GAMES.map((game) => {
                const active     = game.id === selectedGame;

                return (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-emerald-500/70 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm tracking-wider font-bold ${active ? "text-emerald-400" : "text-foreground"}`}>
                        {game.label}
                      </span>

                    </div>

                    <span className="mt-1 text-[10px] text-muted-foreground">{game.tagline}</span>

                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: active game panel */}
          <div className="flex flex-1 flex-col rounded-3xl border border-border bg-card/80 px-8 py-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight glow-emerald">
                {MINI_GAMES.find((g) => g.id === selectedGame)?.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground font-bold">
                {cooldowns[selectedGame] || MINI_GAMES.find((g) => g.id === selectedGame)?.tagline}
              </p>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="mb-6 rounded-2xl border border-border bg-background/40 px-6 py-6 min-h-[360px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isRunning ? (
                    <motion.div
                      key="running"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-6"
                    >
                      <div className="flex gap-3">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="h-12 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40"
                          />
                        ))}
                      </div>
                      <p className="mt-4 text-sm font-bold text-emerald-500">
                        Executing...
                      </p>
                    </motion.div>
                  ) : outcome ? (
                    <motion.div
                      key="outcome"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4"
                    >
                      <div className={`text-5xl mb-3 font-black ${
                        outcome.type === "win"
                          ? "text-emerald-400 shadow-emerald-400 glow-emerald"
                          : outcome.type === "neutral"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}>
                        {outcome.type === "win" ? "▲" : outcome.type === "neutral" ? "—" : "▼"}
                      </div>

                      {outcome.earned !== 0 && (
                        <div
                          className={`text-3xl font-black mb-2 copyable ${outcome.earned > 0 ? "text-emerald-400 glow-emerald" : "text-red-400"}`}
                          onClick={() => copyToClipboard(Math.abs(outcome.earned))}
                          title="Click to copy"
                        >
                          {outcome.earned > 0 ? "+" : "-"}${Math.abs(outcome.earned).toLocaleString()}
                        </div>
                      )}

                      <h3 className={`text-lg font-black ${
                        outcome.type === "win"
                          ? "text-emerald-400"
                          : outcome.type === "neutral"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}>
                        {outcome.type === "win" ? "Win!" : outcome.type === "neutral" ? "Nothing" : "Loss"}
                      </h3>
                      <p className="mt-2 text-sm font-mono text-muted-foreground font-bold">{outcome.detail}</p>

                      <Button
                        variant="ghost"
                        className="mt-6 text-sm font-bold hover:bg-white/[0.05] px-4 py-2 rounded-lg transition-all"
                        onClick={() => setOutcome(null)}
                      >
                        Try Again
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center gap-3 py-4 text-center"
                    >
                      <p className="text-lg font-black text-foreground">
                        {selectedGame === "loan" ? "Need cash?" : "Ready to play?"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                        {selectedGame === "loan"
                          ? `Take a quick loan of $100–$500. You'll owe double back.${loanBalance > 0 ? ` Outstanding loan: $${loanBalance.toLocaleString()}.` : ""}`
                          : "Set your stake and let's see what happens. You could win big or lose it all!"}
                      </p>
                      {/* Loan balance indicator */}
                      {selectedGame === "loan" && loanBalance > 0 && (
                        <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center">
                          <p className="text-xs text-amber-400/80 font-black mb-0.5">Outstanding Debt</p>
                          <p className="text-xl font-black text-amber-400">${loanBalance.toLocaleString()}</p>
                          <p className="text-xs text-amber-400/60 font-bold">Payback: ${(loanBalance * 2).toLocaleString()}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-auto space-y-3">
                {selectedGame === "gamble" ? (
                  <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <Button
                      onClick={() => setDrawerOpen(true)}
                      className="w-full h-12 px-6 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/50"
                      disabled={!!cooldowns[selectedGame] || isRunning}
                    >
                      {isRunning ? "Running..." : "Enter Bet"}
                    </Button>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>How much to bet?</DrawerTitle>
                      </DrawerHeader>
                      <DrawerBody>
                        <div className="space-y-6">
                          <Input
                            type="text"
                            placeholder="0"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="h-20 text-center text-4xl font-bold bg-card"
                            disabled={isRunning}
                          />
                          <div className="grid grid-cols-4 gap-3">
                            {[100, 500, 1000, 5000, 10000, 50000].map((val) => (
                              <Button
                                key={val}
                                variant="outline"
                                className="h-14 font-bold text-sm"
                                onClick={() => setBetAmount(val.toString())}
                                disabled={isRunning}
                              >
                                ${val >= 1000 ? `${val / 1000}k` : val}
                              </Button>
                            ))}
                          </div>
                           <p className="text-xs text-muted-foreground text-center font-bold">
                            You can bet more than you have — capital can go negative
                          </p>
                        </div>
                      </DrawerBody>
                      <DrawerFooter className="grid grid-cols-2 gap-3">
                        <DrawerClose asChild>
                          <Button variant="outline" className="w-full h-16 font-bold text-sm">
                            Cancel
                          </Button>
                        </DrawerClose>
                        <Button
                          className="w-full bg-emerald-600 text-white hover:bg-emerald-500 h-16 text-sm font-bold"
                          disabled={isRunning || !betAmount}
                          onClick={() => {
                            handlePlay();
                            setDrawerOpen(false);
                          }}
                        >
                          {isRunning ? "Wait..." : "Play Now"}
                        </Button>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                ) : selectedGame === "loan" ? (
                  <div className="space-y-3">
                    {loanBalance > 0 ? (
                      <Button
                        className="w-full h-12 px-6 rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] border bg-red-700 hover:bg-red-600 border-red-500/50"
                        onClick={handlePaybackLoan}
                        disabled={isRunning}
                      >
                        Pay Back Loan (${(loanBalance * 2).toLocaleString()})
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-12 px-6 rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] border bg-amber-600 hover:bg-amber-500 border-amber-500/50"
                        onClick={handlePlay}
                        disabled={isRunning || !!cooldowns[selectedGame]}
                      >
                        {isRunning ? "Running..." : "Take Loan"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 px-6 rounded-xl text-sm font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] border bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50"
                    onClick={handlePlay}
                    disabled={isRunning || !!cooldowns[selectedGame]}
                  >
                    {isRunning ? "Running..." : "Play Now"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Repossession Modal */}
      <Dialog open={showBustModal} onOpenChange={setShowBustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repossessed</DialogTitle>
            <DialogDescription>
              You sank too deep. The collectors came.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-5 text-center">
              <p className="text-sm font-semibold text-red-400">Debt Cleared</p>
              <p className="mt-2 text-4xl font-black text-red-400">-$5,000+</p>
              <p className="mt-1 text-xs text-muted-foreground">All assets seized. Capital reset to $100.</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You hit the debt floor. Time to grind back up — or find another loan.
            </p>
            <div className="flex justify-end">
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-sm"
                onClick={() => { setShowBustModal(false); refreshUser(); }}
              >
                Start Over
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}