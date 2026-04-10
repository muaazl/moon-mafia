import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Medal } from "lucide-react";

import { api } from "../../lib/api";
import { API_ROUTES } from "../../lib/constants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "../../store/useAuthStore";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "../components/ui/drawer";

type LeaderboardEntry = {
  name: string;
  avatar_url?: string;
  capital: number;
};

export function LeaderboardScreen() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tipRecipient, setTipRecipient] = useState<LeaderboardEntry | null>(null);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [isTipping, setIsTipping] = useState(false);

  const fetchLeaderboard = () => {
    setLoading(true);
    api.get<LeaderboardEntry[]>(API_ROUTES.GAME.LEADERBOARD)
      .then(res => {
        setLeaderboard(res.data);
      })
      .catch((_err) => {
        toast.error("Connection Error", { description: "Failed to load the associate rankings." });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleTip = async () => {
    if (!tipRecipient || !tipAmount) return;
    const amount = parseFloat(tipAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid Amount", { description: "Please enter a valid tip amount." });
      return;
    }

    if (amount > (user?.capital || 0)) {
      toast.error("Insufficient Funds", { description: "You cannot tip more than your current capital." });
      return;
    }

    setIsTipping(true);
    try {
      const { data } = await api.post(API_ROUTES.GAME.TIP, {
        recipient_name: tipRecipient.name,
        amount: amount
      });
      
      toast.success("Tip Sent", { description: data.detail });
      setTipRecipient(null);
      setTipAmount("");
      
      await refreshUser();
      fetchLeaderboard();
    } catch (error: any) {
      toast.error("Tip Failed", { description: error.response?.data?.detail || "Something went wrong." });
    } finally {
      setIsTipping(false);
    }
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
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="h-screen w-full flex flex-col relative z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start p-4 md:p-8 relative z-30"
      >
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex flex-col items-end text-right">
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto px-4 relative z-20 pb-8 min-h-0"
      >
        <motion.div variants={itemVariants} className="text-center mb-6 md:mb-8 flex-shrink-0">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground font-bold">
            The World's Most Successful Associates.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="w-full relative flex-1 min-h-0 flex flex-col">
          <div className="flex-1 flex flex-col rounded-3xl border border-white/[0.06] bg-black/40 overflow-hidden shadow-2xl relative">
            <div className="grid grid-cols-[3rem_minmax(0,1fr)_8rem_6rem] gap-4 p-4 border-b border-white/[0.06] bg-black/60 items-center text-xs font-bold text-muted-foreground flex-shrink-0">
              <div className="text-center">Rank</div>
              <div>Player</div>
              <div className="text-right">Funds</div>
              <div className="text-center">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto w-full no-scrollbar select-none focus:outline-none">
              {loading ? (
                <div className="flex justify-center items-center h-full min-h-[40vh]">
                  <span className="text-sm font-bold text-emerald-400 animate-pulse">Fetching Data...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex justify-center items-center h-full min-h-[40vh] opacity-50">
                  <span className="text-sm font-bold text-muted-foreground text-center">No Data Available</span>
                </div>
              ) : (
                <div className="flex flex-col pb-4">
                  {leaderboard.map((entry, idx) => (
                    <motion.div
                      variants={itemVariants}
                      key={idx}
                      className={`grid grid-cols-[3rem_minmax(0,1fr)_8rem_6rem] gap-4 p-5 items-center border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors ${idx < 3 ? 'bg-emerald-500/[0.02]' : ''}`}
                    >
                      <div className="text-center font-bold text-lg text-muted-foreground relative flex justify-center">
                        {idx === 0 && <Medal className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />}
                        {idx === 1 && <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />}
                        {idx === 2 && <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />}
                        {idx > 2 && <span className="text-sm">#{idx + 1}</span>}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted/20" />
                          )}
                        </div>
                        <span className={`font-black truncate tracking-tight ${idx < 3 ? 'text-emerald-400 glow-emerald' : 'text-foreground'}`}>
                          {entry.name} {entry.name === user?.name && "(You)"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm md:text-base font-black truncate tracking-tight ${entry.capital < 0 ? 'text-red-400' : 'text-foreground'}`}>
                          {entry.capital < 0 ? '-' : ''}${Math.abs(entry.capital).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      <div className="flex justify-center">
                        {entry.name !== user?.name && (
                          <Button 
                            onClick={() => setTipRecipient(entry)}
                            variant="ghost" 
                            className="h-8 px-3 text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          >
                            Tip
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <Drawer
        open={tipRecipient !== null}
        onOpenChange={(open) => {
          if (!open) setTipRecipient(null);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Tip {tipRecipient?.name}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-6">
              <div className="rounded-xl border border-white/[0.06] bg-black/40 p-6 text-center">
                <p className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-2">Your Available Funds</p>
                <p className="text-3xl font-black text-emerald-400 glow-emerald">
                  ${(user?.capital || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="Enter tip amount"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="h-16 text-center text-2xl font-black bg-black/40 border-white/[0.06]"
                    disabled={isTipping}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      className="h-12 font-black text-xs tracking-widest bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                      onClick={() => setTipAmount(val.toString())}
                      disabled={isTipping}
                    >
                      ${val}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="grid grid-cols-2 gap-3 pb-8">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-14 font-black tracking-widest uppercase text-xs" disabled={isTipping}>
                Cancel
              </Button>
            </DrawerClose>
            <Button 
              className="w-full h-14 bg-emerald-600 text-white hover:bg-emerald-500 font-black tracking-widest uppercase text-xs shadow-lg shadow-emerald-500/20" 
              onClick={handleTip} 
              disabled={isTipping || !tipAmount}
            >
              {isTipping ? "Sending..." : "Confirm Tip"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}