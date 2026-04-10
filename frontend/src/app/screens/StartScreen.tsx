import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";

import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../lib/api";
import { LogOut } from "lucide-react";
import { GameDifficulty, GameMode, DIFFICULTIES, GAME_MODES, API_ROUTES } from "../../lib/constants";
import { TutorialModal } from "../components/TutorialModal";

const copyToClipboard = (value: number) => {
  navigator.clipboard.writeText(value.toString()).then(() => {
    toast.success("Copied!", { description: `$${value.toLocaleString()} copied to clipboard.` });
  });
};

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dotted-dialog";

export function StartScreen() {
  const navigate = useNavigate();
  const { user, clearUser, refreshUser } = useAuthStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(GameDifficulty.MEDIUM);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CLASSIC);
  const [lockedStake, setLockedStake] = useState<string>("100");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user && !user.has_seen_tutorial) {
      setShowTutorial(true);
    }
  }, [user]);

  const handleFinishTutorial = async () => {
    setShowTutorial(false);
    try {
      await api.patch("/auth/me", { has_seen_tutorial: true });
      await refreshUser();
    } catch (error) {
      toast.error("Sync Error", { description: "Failed to update tutorial status." });
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleStartGame = () => {
    const parsedStake = parseInt(lockedStake);
    if (isNaN(parsedStake) || parsedStake <= 0) {
      toast.error("Invalid Stake", { description: "Please enter a valid amount." });
      return;
    }

    const maxAllowed = Math.max(100, (user?.capital || 0) * 0.5);
    if (parsedStake > maxAllowed) {
      toast.error("Stake Limit Exceeded", { description: `You cannot stake more than 50% of your funds ($${maxAllowed.toFixed(0)} max).` });
      return;
    }

    setShowConfigModal(false);
    navigate("/game", { state: { difficulty: selectedDifficulty, mode: selectedMode, stake: parsedStake } });
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 p-4 md:p-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start relative z-20"
      >
        <button
          onClick={async () => {
            try {
              await api.post(API_ROUTES.AUTH.LOGOUT);
            } catch (e) {
            }
            clearUser();
            navigate("/");
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all tracking-wider text-sm font-bold"
        >
          <LogOut size={16} />
          Logout
        </button>

        <div className="relative flex flex-col items-end text-right min-w-[200px] group">
          {user?.avatar_url && (
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full overflow-hidden opacity-20 grayscale pointer-events-none blur-[2px] transition-all duration-700">
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover scale-110" />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-end mb-2">
            <span className="text-2xl font-black text-foreground tracking-tighter glow-emerald leading-none">{user?.name || "Player"}</span>
          </div>

          <div className="relative z-10 flex flex-col items-end">
            <span className="text-sm font-bold tracking-wider text-muted-foreground opacity-60 mb-1">Available Funds</span>
            <span
              className={`text-xl font-black tracking-tight copyable ${(user?.capital ?? 0) < 0
                  ? "text-red-400 glow-red"
                  : "text-emerald-400 glow-emerald"
                }`}
              onClick={() => copyToClipboard(user?.capital ?? 0)}
              title="Click to copy"
            >
              {(user?.capital ?? 0) < 0 ? "-" : ""}${Math.abs(user?.capital ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto w-full mt-4 md:mt-0 relative z-20 gap-8 h-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:flex w-72 flex-col py-8 lg:border-r border-white/10 lg:pr-8"
        >
          <div className="inline-block px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 backdrop-blur-md self-start">
            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Career Stats</span>
          </div>
          
          <div className="space-y-3 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent blur-xl -z-10 pointer-events-none" />
            
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider">Games Played</span>
              <span className="text-sm font-black text-foreground glow-emerald">{user?.games_played || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider">Total Rounds</span>
              <span className="text-sm font-black text-foreground">{user?.total_rounds || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider">Total Wins</span>
              <span className="text-sm font-black text-emerald-400">{user?.total_wins || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider">Total Losses</span>
              <span className="text-sm font-black text-red-400">{user?.total_losses || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider">Win Rate</span>
              <span className="text-sm font-black text-foreground">
                {user?.games_played ? Math.round(((user?.total_wins || 0) / user?.games_played) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider text-red-400/80">Heart Wins</span>
              <span className="text-sm font-black text-foreground">{user?.heart_mode_wins || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.05] shadow-inner transition-colors">
              <span className="text-xs text-muted-foreground font-bold tracking-wider text-orange-400/80">Carrot Wins</span>
              <span className="text-sm font-black text-foreground">{user?.carrot_mode_wins || 0}</span>
            </div>
          </div>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col items-center justify-center w-full min-w-0"
        >
          <motion.div variants={itemVariants} className="text-center mb-10 md:mb-12 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 glow-emerald">
              Moon Mafia
            </h1>
            <p className="text-xs text-muted-foreground">
              Choose your game settings below before you start playing.
            </p>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full justify-center mb-12 md:mb-16">
            <motion.div variants={itemVariants} className="flex-1 w-full md:max-w-xs">
              <h3 className="text-sm text-muted-foreground tracking-wider font-bold mb-4 ml-1">
                Select Mode
              </h3>
              <div className="space-y-3">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex flex-col gap-1 border-l-4 ${selectedMode === mode.id
                      ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "bg-black/40 border-transparent hover:bg-black/50 hover:border-border transition-all"
                      }`}
                  >
                    <span
                      className={`font-bold tracking-wider text-sm ${selectedMode === mode.id ? "text-emerald-400" : "text-foreground"}`}
                    >
                      {mode.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mode.description}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="flex-1 w-full md:max-w-xs">
              <h3 className="text-sm text-muted-foreground tracking-wider font-bold mb-4 ml-1">
                Select Difficulty
              </h3>
              <div className="space-y-3">
                {DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center justify-between border-l-4 ${selectedDifficulty === difficulty.id
                      ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "bg-black/40 border-transparent hover:bg-black/50 hover:border-border transition-all"
                      }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span
                        className={`font-bold tracking-wider text-sm ${selectedDifficulty === difficulty.id ? "text-emerald-400" : "text-foreground"}`}
                      >
                        {difficulty.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {difficulty.multiplier} Bonus
                      </span>
                    </div>
                    {selectedDifficulty === difficulty.id && (
                      <motion.div
                        layoutId="difficulty-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 md:gap-6 w-full md:max-w-sm"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConfigModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl tracking-wider text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/50"
            >
              Start Game
            </motion.button>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate("/mini-games")}
                className="flex-1 bg-black/40 hover:bg-black/60 border border-border/50 text-foreground font-bold py-3 rounded-lg tracking-wider text-sm transition-all"
              >
                Mini Games
              </button>
              <button
                onClick={() => navigate("/how-to-play")}
                className="flex-1 bg-black/40 hover:bg-black/60 border border-border/50 text-foreground font-bold py-3 rounded-lg tracking-wider text-sm transition-all"
              >
                How To Play
              </button>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate("/leaderboard")}
                className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded transition-all tracking-wider text-xs font-bold mt-2 flex items-center gap-1"
              >
                Leaderboard
              </button>
              <span className="text-muted-foreground/30 mt-2">•</span>
              <button
                onClick={() => navigate("/settings")}
                className="text-muted-foreground hover:text-foreground tracking-wider text-xs font-bold mt-2 transition-colors"
              >
                Settings
              </button>
              <span className="text-muted-foreground/30 mt-2">•</span>
              <button
                onClick={() => navigate("/credits")}
                className="text-muted-foreground hover:text-foreground tracking-wider text-xs font-bold mt-2 transition-colors"
              >
                Credits
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Setup</DialogTitle>
            <DialogDescription>
              Enter the amount you want to play with in each round.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold tracking-wider text-muted-foreground ml-1">Your Stake</label>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="100"
                  value={lockedStake}
                  onChange={(e) => setLockedStake(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartGame()}
                  className="h-14 text-lg font-semibold bg-card pr-32"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <button
                    onClick={() => {
                      const max = Math.max(100, (user?.capital || 0) * 0.5);
                      setLockedStake(Math.floor(max).toString());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase transition-all border border-emerald-500/20"
                  >
                    Max
                  </button>
                  <button
                    onClick={() => {
                        const half = Math.max(100, (user?.capital || 0) * 0.25);
                        const rounded = Math.floor(half / 10) * 10;
                        setLockedStake(rounded.toString());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-[10px] font-black tracking-widest uppercase transition-all border border-white/10"
                  >
                    50%
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
              Tip: The game ends if your balance falls below this amount.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStartGame}>
                Play
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TutorialModal 
        open={showTutorial} 
        onClose={() => setShowTutorial(false)} 
        onFinish={handleFinishTutorial} 
      />

    </div>
  );
}
