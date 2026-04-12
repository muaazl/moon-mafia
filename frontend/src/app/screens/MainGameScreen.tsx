import { useState, useEffect, useCallback, useRef, memo } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { HUDCard } from "../components/HUDCard";
import { toast } from "sonner";

import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../lib/api";
import { FetchResponse, ActionResponse, AuditResponse } from "../../lib/types";
import { API_ROUTES, UI_MESSAGES } from "../../lib/constants";
import { formatNumber } from "../../lib/formatNumber";
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
import { PriceChart } from "../components/PriceChart";
import { playSound, playHaptic } from "../../lib/audio";
import { useSettingsStore } from "../../store/useSettingsStore";
import { fireJackpotConfetti, fireWinConfetti, fireStreakConfetti } from "../../lib/confetti";

const copyToClipboard = (value: number) => {
  navigator.clipboard.writeText(value.toString()).then(() => {
    toast.success("Copied!", { description: `$${value.toLocaleString()} copied to clipboard.` });
  });
};

// BOLT OPTIMIZATION: Memoize AnimatedCounter to prevent constant re-renders during timer ticks.
const AnimatedCounter = memo(({ value, prefix = "", duration = 1, force = false }: { value: number; prefix?: string; duration?: number; force?: boolean }) => {
  const { highQuality } = useSettingsStore();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    if (start === end) {
        setDisplayValue(end);
        return;
    }

    if (!highQuality && !force) {
        setDisplayValue(end);
        prevValue.current = end;
        return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);

      const current = Math.floor(start + (end - start) * progress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, highQuality]);

  return <span>{prefix}{formatNumber(displayValue)}</span>;
});

export function MainGameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameSettings = location.state || { difficulty: "medium", mode: "classic", stake: 100 };
  const lockedStake = gameSettings.stake || 100;

  const [capital, setCapital] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const { user } = useAuthStore();
  const [timer, setTimer] = useState(30);
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [activeStake, setActiveStake] = useState(lockedStake);
  const [isImageFaded, setIsImageFaded] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const [history, setHistory] = useState<number[]>([0]);

  const isUnlimited = gameSettings.mode === "unlimited";
  const fadeDuration = gameSettings.difficulty === "hard" ? 0.1 : gameSettings.difficulty === "medium" ? 2 : 5;

  const [lastRoundResult, setLastRoundResult] = useState<{
    gainLoss: number;
    hearts: number;
    carrots: number;
    show: boolean;
  } | null>(null);

  const auditRevealActive = useRef(false);

  const [totalGains, setTotalGains] = useState(0);
  const [totalLosses, setTotalLosses] = useState(0);
  const netProfit = totalGains - totalLosses;

  const [actionType, setActionType] = useState<"HYPE" | "PURGE" | "BET" | null>(null);
  const [sessionStartCapital, setSessionStartCapital] = useState(0);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditCostPreview, setAuditCostPreview] = useState<number | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showLeaveTableModal, setShowLeaveTableModal] = useState(false);

  const [predictedHearts, setPredictedHearts] = useState("");
  const [predictedCarrots, setPredictedCarrots] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGame = useCallback(async (currentRound: number) => {
    try {
      setIsDataVisible(false);
      setTimer(0);
      setImageLoaded(false);

      const { data } = await api.get<FetchResponse>(
        `${API_ROUTES.GAME.FETCH}?mode=${gameSettings.mode}&difficulty=${gameSettings.difficulty}&stake=${lockedStake}&round_number=${currentRound}`
      );

      const img = new Image();
      img.src = data.image_url;
      img.onload = () => {
        setImageUrl(data.image_url);
        setImageLoaded(true);
        setIsDataVisible(true);
        setIsImageFaded(false);
        setTimer(isUnlimited ? Math.max(1, 10 - Math.floor(currentRound / 2)) : data.difficulty_seconds);
      };

      setCapital(data.capital);
      if (currentRound === 1) {
        setSessionStartCapital(data.capital);
      }
      
      const maxAllowed = Math.max(100.0, data.capital * 0.5);
      if (activeStake > maxAllowed) {
        setActiveStake(maxAllowed);
        toast.warning("Stake Scaled Down", { description: `Your stake has been automatically scaled down to $${maxAllowed.toFixed(0)} to keep you within the 50% limit.` });
      }

      setStreak(data.streak || 0);
    } catch (e: any) {
      toast.error("Oops!", { description: UI_MESSAGES.GAME.FETCH_ERROR });
      navigate("/start");
    }
  }, [gameSettings, navigate, isUnlimited, lockedStake]);

  useEffect(() => {
    fetchGame(1);
  }, []);

  useEffect(() => {
    if (isDataVisible && imageLoaded && !isImageFaded && !auditRevealActive.current) {
      const timeout = setTimeout(() => {
        setIsImageFaded(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isDataVisible, imageLoaded, isImageFaded, imageUrl]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const executeAction = async (targetAction?: "HYPE" | "PURGE" | "BET") => {
    const actionToRun = targetAction || actionType;
    if (!actionToRun) return;


    const payload: any = {
      action: actionToRun,
      stake: activeStake,
      round_number: round,
    };

    if (actionToRun === "BET") {
      const hearts = parseInt(predictedHearts);
      if (isNaN(hearts)) {
        toast.error("Missing prediction", { description: UI_MESSAGES.GAME.STAKE_REQUIRED });
        return;
      }
      payload.predicted_value = hearts;
      const carrots = parseInt(predictedCarrots);
      if (!isNaN(carrots)) {
        payload.predicted_carrots = carrots;
      }
    }

    setIsSubmitting(true);
    setTimer(0);
    try {
      const { data } = await api.post<ActionResponse>(API_ROUTES.GAME.ACTION, payload);
      const gainLoss = Math.round((data.capital - capital) * 100) / 100;

      setCapital(data.capital);
      setStreak(data.streak || 0);

      setHistory(prev => [...prev, gainLoss]);

      if (gainLoss > 0) setTotalGains((prev) => prev + gainLoss);
      else if (gainLoss < 0) setTotalLosses((prev) => prev + Math.abs(gainLoss));

      setLastRoundResult({
        gainLoss,
        hearts: data.hearts ?? 0,
        carrots: data.carrots ?? 0,
        show: true,
      });

      if (gainLoss > 0) {
        playSound("win");
        playHaptic("heavy");
      } else if (gainLoss < 0) {
        playSound("lose");
        playHaptic("heavy");
      }

      setActionType(null);
      setPredictedHearts("");
      setPredictedCarrots("");
      setIsDataVisible(false);

      const isGameOver = data.capital < lockedStake || 
                        (gameSettings.mode === "classic" && round >= 10);

      if (isGameOver) {
        playSound("gameover");
        if (isWin) fireWinConfetti();
        setTimeout(() => setShowGameOverModal(true), 1000);
      } else {
        if (data.outcome === "JACKPOT") {
          fireJackpotConfetti();
        } else if (gainLoss > activeStake * 1.5) {
          fireWinConfetti();
        }

        if (data.streak === 5 || data.streak === 10 || data.streak === 20) {
          fireStreakConfetti();
        }

        setRound((r) => r + 1);
        fetchGame(round + 1);
      }

    } catch (error: any) {
      toast.error("Failed", { description: error.response?.data?.detail || "Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAuditModal = () => {
    const rates: Record<string, number> = { easy: 0.50, medium: 0.60, hard: 0.75 };
    const minimums: Record<string, number> = { easy: 50, medium: 100, hard: 150 };
    const rate = rates[gameSettings.difficulty] ?? 0.60;
    const minimum = minimums[gameSettings.difficulty] ?? 100;
    const cost = Math.max(minimum, Math.floor(lockedStake * rate));
    setAuditCostPreview(cost);
    setShowAuditModal(true);
  };

  const confirmAudit = async () => {
    if (capital > 0) {
      setIsSubmitting(true);
      try {
        const { data } = await api.get<AuditResponse>(API_ROUTES.GAME.AUDIT);
        if (data.capital !== undefined) setCapital(data.capital);

        const revealMs = gameSettings.difficulty === "hard" ? 500 : gameSettings.difficulty === "medium" ? 2000 : 3000;
        const revealLabel = gameSettings.difficulty === "hard" ? "0.5 seconds" : gameSettings.difficulty === "medium" ? "2 seconds" : "3 seconds";
        auditRevealActive.current = true;
        setIsImageFaded(false);
        setShowAuditModal(false);
        toast.success("Hint Used", { description: `Vision restored for ${revealLabel}! Cost: $${data.audit_cost}.` });

        setTimeout(() => {
          auditRevealActive.current = false;
          setIsImageFaded(true);
        }, revealMs);

      } catch (error: any) {
        toast.error("Failed", { description: error.response?.data?.detail || "Could not get hint." });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast("Locked Out", { description: "The broker network won't assist operatives who are in the red." });
    }
  };

  const handleLeaveTable = () => {
    setShowLeaveTableModal(true);
  };

  const confirmLeaveTable = async () => {
    setShowLeaveTableModal(false);
    
    if (round < 10) {
      try {
        const { data } = await api.post<ActionResponse>(API_ROUTES.GAME.FORFEIT);
        setCapital(data.capital);
        toast.error("Early Exit Penalty", { 
          description: `You were fined your stake of $${activeStake.toLocaleString()} for leaving before Round 10.` 
        });
        playSound("lose");
      } catch (error: any) {
        toast.error("Operation Failed", { description: "Forfeit process encountered an error." });
      }
    } else {
      playSound("gameover");
    }
    
    setShowGameOverModal(true);
  };

  const isWin = capital > sessionStartCapital;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col transition-colors duration-500 relative overflow-hidden">


      <div className="bg-card/60 backdrop-blur-xl border-b border-border px-10 py-6 z-20 shadow-sm relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            {user?.avatar_url && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-semibold text-foreground">
                {user?.name || "Player"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold tracking-wider text-muted-foreground mb-1">Balance</span>
              <div className={`text-xl font-black tracking-tight ${capital < 0 ? "text-red-400" : "text-emerald-400 glow-emerald"}`}>
                <span
                  className="copyable"
                  onClick={() => copyToClipboard(capital)}
                  title="Click to copy"
                >
                  {capital < 0 ? "-" : ""}$<AnimatedCounter value={Math.abs(capital)} force />
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm font-bold tracking-wider text-muted-foreground mb-1">Streak</span>
              <div className={`text-xl font-black tracking-tight ${streak >= 6 ? "text-emerald-400 glow-emerald" : streak >= 3 ? "text-yellow-400" : "text-foreground"
                }`}>
                {streak > 0 ? `🔥 ${streak}` : "-"}
              </div>
            </div>

            <HUDCard label="Time" value={`${timer}s`} align="right" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-10 py-8">
        <div className="mx-auto max-w-6xl mb-6 flex justify-between items-center">
          <button
            onClick={handleLeaveTable}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all tracking-wider text-sm font-bold"
          >
            <ArrowLeftIcon size={14} />
            Cash Out / Leave
          </button>

        </div>
        <div className="mx-auto flex h-full max-w-6xl gap-8">
          <div className="flex min-w-[660px] max-w-[660px] flex-col gap-6">
            <div className="h-[360px] w-[660px] overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm relative group">
              {isDataVisible && imageLoaded && (
                <img
                  src={imageUrl}
                  alt="Game Feed"
                  style={{
                    transition: gameSettings.difficulty === "hard" ? "none" : `opacity ${fadeDuration}s ease-in-out`,
                    opacity: isImageFaded ? 0 : 1,
                  }}
                  className="game-fade-img h-full w-full object-cover select-none"
                />
              )}
              {!(isDataVisible && imageLoaded) && (
                <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground uppercase tracking-widest text-xs font-semibold">
                  Waiting for feed...
                </div>
              )}
            </div>
            <div className="flex-1 rounded-3xl border border-border bg-card/80 px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wider text-muted-foreground">
                  History
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Round #{String(round).padStart(4, "0")} • {gameSettings.difficulty}
                </span>
              </div>
              <div className="h-[140px] w-full">
                <PriceChart history={history} />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card/80 px-6 py-5">
              <div className="mb-4 flex items-baseline justify-between">
                <div>
                  <div className="text-sm font-bold tracking-wider text-muted-foreground">
                    Round
                  </div>
                  <div className="text-3xl font-semibold text-foreground">
                    {round}
                    {gameSettings.mode === "unlimited" ? " / ∞" : " / 10"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tracking-wider text-muted-foreground flex items-center justify-end gap-2">
                    Stake
                  </div>
                  <div className="text-xl font-medium text-foreground flex items-center gap-2 justify-end">
                    {activeStake < lockedStake && (
                      <span className="text-xs line-through text-muted-foreground opacity-50">${Math.round(lockedStake)}</span>
                    )}
                    <span className={activeStake < lockedStake ? "text-yellow-400" : ""}>
                      ${Math.round(activeStake).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                {!isDataVisible ? "Feed closed. Please wait." : "Hype if hearts dominate. Purge if carrots do."}
              </div>
            </div>

            <div className="flex-1 rounded-3xl border border-border bg-card/80 px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold tracking-wider text-muted-foreground">
                  Last Result
                </span>
                {lastRoundResult?.show && (
                  <span className={`text-sm font-bold tracking-wider ${lastRoundResult.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}>
                    {lastRoundResult.gainLoss >= 0 ? "Win" : "Loss"}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                  <div className="flex items-end gap-3">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground opacity-50 mb-0.5">This Round</div>
                      {lastRoundResult ? (
                        <div className={`text-4xl font-black copyable ${lastRoundResult.gainLoss >= 0 ? "text-emerald-400 glow-emerald" : "text-red-400"}`}
                          onClick={() => copyToClipboard(lastRoundResult.gainLoss)}
                          title="Click to copy"
                        >
                          {lastRoundResult.gainLoss >= 0 ? "+" : "-"}$<AnimatedCounter value={Math.abs(lastRoundResult.gainLoss)} force />
                        </div>
                      ) : (
                        <div className="text-4xl font-black text-muted-foreground/20">—</div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-border/40" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                      <div className="text-xs tracking-wider text-muted-foreground opacity-60">Total Won</div>
                      <div className="text-base font-black text-emerald-400">
                        +$<AnimatedCounter value={Math.round(totalGains)} force />
                      </div>
                    </div>
                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 px-3 py-2">
                      <div className="text-xs tracking-wider text-muted-foreground opacity-60">Total Lost</div>
                      <div className="text-base font-black text-red-400">
                        -$<AnimatedCounter value={Math.round(totalLosses)} force />
                      </div>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2 flex items-center gap-2">
                      <span className="text-base">❤️</span>
                      <div>
                        <div className="text-xs tracking-wider text-muted-foreground opacity-60">Hearts</div>
                        <div className="text-base font-black text-foreground">
                          <AnimatedCounter value={lastRoundResult?.hearts ?? 0} force />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-card border border-border/50 px-3 py-2 flex items-center gap-2">
                      <span className="text-base">🥕</span>
                      <div>
                        <div className="text-xs tracking-wider text-muted-foreground opacity-60">Carrots</div>
                        <div className="text-base font-black text-foreground">
                          <AnimatedCounter value={lastRoundResult?.carrots ?? 0} force />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            <div className="rounded-3xl border border-border bg-card/80 px-6 py-5">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  disabled={!isDataVisible || isSubmitting}
                  className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold tracking-wider text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                  onClick={() => executeAction("HYPE")}
                >
                  Hype
                </Button>
                <Button
                  disabled={!isDataVisible || isSubmitting}
                  className="h-14 rounded-xl bg-red-500 hover:bg-red-400 text-sm font-bold tracking-wider text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
                  onClick={() => executeAction("PURGE")}
                >
                  Purge
                </Button>
                <Button
                  disabled={!isDataVisible || isSubmitting}
                  variant="outline"
                  className="h-14 rounded-xl border-border hover:bg-white/[0.05] text-sm font-bold tracking-wider transition-all"
                  onClick={() => setActionType("BET")}
                >
                  Bet
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-start">
                <button
                  disabled={!isDataVisible || isSubmitting}
                  onClick={openAuditModal}
                  className="text-xs font-bold tracking-wider text-muted-foreground hover:text-emerald-400 disabled:opacity-50 transition-colors"
                >
                  Reveal Hint (-Stake)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={actionType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Make your move: {actionType}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center relative overflow-hidden">
                {activeStake < lockedStake && (
                  <div className="absolute inset-0 bg-yellow-500/10" />
                )}
                <p className="text-sm font-bold tracking-wider text-muted-foreground relative z-10">Your Stake</p>
                <p className={`text-2xl font-semibold relative z-10 ${activeStake < lockedStake ? "text-yellow-400" : "text-foreground"}`}>
                  ${Math.round(activeStake).toLocaleString()}
                </p>
              </div>

              {actionType === "BET" && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold tracking-wider text-muted-foreground">Hearts Seen</label>
                    <Input
                      type="text"
                      placeholder="Required"
                      value={predictedHearts}
                      onChange={(e) => setPredictedHearts(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") executeAction(); }}
                      className="h-12"
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold tracking-wider text-muted-foreground">Carrots Seen</label>
                    <Input
                      type="text"
                      placeholder="Optional"
                      value={predictedCarrots}
                      onChange={(e) => setPredictedCarrots(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") executeAction(); }}
                      className="h-12"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-2 gap-3">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full" disabled={isSubmitting}>
                Cancel
              </Button>
            </DrawerClose>
            <Button className="w-full bg-emerald-600" onClick={() => executeAction()} disabled={isSubmitting}>
              {isSubmitting ? "Wait..." : "Confirm Bet"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reveal Hint</DialogTitle>
            <DialogDescription>
              Briefly reveals the image for 3 seconds so you can count.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-5 text-center">
              <p className="text-sm font-bold tracking-wider text-emerald-400">
                Hint Cost
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-400">
                ${auditCostPreview?.toLocaleString() ?? "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This will be deducted from your balance
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The image will be fully visible for 3 seconds after you confirm. Count carefully.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAuditModal(false)}
              >
                Cancel
              </Button>
              <Button className="bg-emerald-600" onClick={confirmAudit} disabled={isSubmitting}>
                {isSubmitting ? "Wait..." : "Reveal Image"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveTableModal} onOpenChange={setShowLeaveTableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Game?</DialogTitle>
            <DialogDescription>
              {round < 10 
                ? `Warning: Leaving before Round 10 will result in a penalty of $${activeStake.toLocaleString()} (your current stake).`
                : gameSettings.mode === "classic"
                  ? "In Classic mode, leaving early forfeits your current round's potential gains."
                  : "Secure your winnings and exit to the operative hub."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLeaveTableModal(false)}
            >
              Continue Playing
            </Button>
            <Button variant="destructive" onClick={confirmLeaveTable}>
              Cash Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showGameOverModal}
        onOpenChange={(open) => {
          if (open) setShowGameOverModal(true);
        }}
      >
        <DialogContent className="max-w-6xl overflow-hidden bg-background/80 backdrop-blur-2xl border-border/50" hideCloseIcon>
          <div className="grid h-full max-h-[85vh] gap-10 md:grid-cols-2 p-6 md:p-10">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className={`text-4xl font-black tracking-tighter ${isWin ? "text-emerald-400 glow-emerald" : "text-red-400"}`}>
                  {isWin ? "You Won!" : "You Lost"}
                </h2>
                <p className="text-sm text-muted-foreground tracking-wide font-bold opacity-70">
                  Performance History
                </p>
              </div>

              <div className="flex-1 min-h-[300px] rounded-3xl border border-border/50 bg-black/20 p-6 overflow-hidden">
                <PriceChart history={history} />
              </div>
            </div>
            <div className="flex flex-col justify-between py-2">
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-muted-foreground font-bold mb-4">Stats</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card/50 border border-border/50 rounded-2xl p-5 flex flex-col justify-center min-h-[100px]">
                      <span className="text-xs text-muted-foreground font-bold block mb-1">Balance</span>
                      <span className={`text-2xl md:text-3xl font-black break-all text-white`}>
                        {capital < 0 ? "-" : ""}$<AnimatedCounter value={Math.abs(capital)} />
                      </span>
                    </div>
                    <div className="bg-card/50 border border-border/50 rounded-2xl p-5 flex flex-col justify-center min-h-[100px]">
                      <span className="text-xs text-muted-foreground font-bold block mb-1">Profit/Loss</span>
                      <span className={`text-2xl md:text-3xl font-black break-all ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {netProfit >= 0 ? "+" : "-"}$<AnimatedCounter value={Math.abs(netProfit)} />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/10">
                    <span className="text-sm text-muted-foreground font-bold">Rounds</span>
                    <span className="text-lg font-black text-foreground">{round}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/10">
                    <span className="text-sm text-muted-foreground font-bold">Efficiency</span>
                    <span className="text-lg font-black text-emerald-400">
                      {Math.floor((totalGains / (totalGains + totalLosses || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/10 text-sm">
                    <span className="text-muted-foreground font-bold">Difficulty</span>
                    <span className="font-black text-foreground tracking-wider">
                      {gameSettings.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                  className="flex-1 h-14 md:h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wider rounded-2xl shadow-xl shadow-emerald-500/10 transition-all active:scale-95"
                  onClick={() => {
                    setShowGameOverModal(false);
                    setRound(1);
                    setTotalGains(0);
                    setTotalLosses(0);
                    setHistory([0]);
                    fetchGame(1);
                  }}
                >
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 md:h-16 border-border/50 bg-white/5 text-foreground font-bold text-sm tracking-wider rounded-2xl transition-all active:scale-95"
                  onClick={() => navigate("/start")}
                >
                  Menu
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

