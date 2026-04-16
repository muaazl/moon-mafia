import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "next-themes";
import { SwitchBasic } from "../components/ui/switch-basic";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { ArrowLeftIcon, User as UserIcon, ShieldCheck, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { api } from "../../lib/api";
import { API_ROUTES } from "../../lib/constants";
import { toast } from "sonner";

type View = "settings" | "profile" | "security";

export function SettingsScreen() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, refreshUser, clearUser } = useAuthStore();
  const { highQuality, setHighQuality, soundEnabled, setSoundEnabled, musicEnabled, setMusicEnabled } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("settings");

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [trait, setTrait] = useState<"male" | "female">("male");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnterProfile = () => {
    setName(user?.name || "");
    setAge(user?.age?.toString() || "");
    setTrait((user?.gender as any) || "male");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setView("profile");
  };

  const handleEnterSecurity = () => {
    setSecurityQuestion(user?.security_question || "");
    setSecurityAnswer("");
    setShowAnswer(false);
    setView("security");
  };

  const handleSaveProfile = async () => {
    if (password && password !== confirmPassword) {
      toast.error("Mismatch", { description: "Passwords do not match." });
      return;
    }

    const payload: any = {};
    if (name !== user?.name) payload.name = name;
    if (age !== user?.age?.toString()) payload.age = parseInt(age, 10) || 0;
    if (trait !== user?.gender) payload.gender = trait;
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setView("settings");
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(API_ROUTES.AUTH.ME, payload);
      await refreshUser();
      toast.success("Profile Updated", { description: "Your details have been saved." });
      setView("settings");
    } catch (error: any) {
      toast.error("Update Failed", { description: error.response?.data?.detail || "Could not save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    const payload: any = {};
    if (securityQuestion !== user?.security_question) payload.security_question = securityQuestion;
    if (securityAnswer) payload.security_answer = securityAnswer;

    if (Object.keys(payload).length === 0) {
      setView("settings");
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(API_ROUTES.AUTH.ME, payload);
      await refreshUser();
      toast.success("Security Updated", { description: "Your security details have been saved." });
      setView("settings");
    } catch (error: any) {
      toast.error("Update Failed", { description: error.response?.data?.detail || "Could not save security settings." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await api.delete(API_ROUTES.AUTH.ME);
      clearUser();
      toast.success("Account Deleted", { description: "Your account has been successfully deleted." });
      navigate("/");
    } catch (error: any) {
      toast.error("Deletion Failed", { description: error.response?.data?.detail || "Could not delete account." });
      setIsSaving(false);
      setShowDeleteModal(false);
    }
  };

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

  const headerTitle = view === "settings" ? "Settings" : view === "profile" ? "Edit Profile" : "Security";
  const headerSub = view === "settings"
    ? "Configure your gameplay experience"
    : view === "profile"
    ? "Update your operative details"
    : "Protect your account";

  const handleBack = () => {
    if (view !== "settings") setView("settings");
    else navigate("/start");
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative z-10 p-4 md:p-6 overflow-x-hidden transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full flex justify-between items-start relative z-20"
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.05] px-3 py-1.5 rounded-lg transition-all text-sm font-bold"
        >
          <ArrowLeftIcon size={14} />
          {view !== "settings" ? "Back to Settings" : "Back"}
        </button>
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full mt-4 md:mt-0 relative z-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 glow-emerald">
            {headerTitle}
          </h1>
          <p className="text-sm text-muted-foreground font-bold">{headerSub}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {view === "settings" && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-card/60 border border-border p-6 sm:p-8 rounded-[40px] shadow-sm relative z-10"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors border-b border-border/50">
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Theme</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">Pick between Carrot and Heart themes</span>
                    </div>
                    {mounted && (
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-primary">
                          {theme === "heart" ? "Heart Theme" : "Carrot Theme"}
                        </span>
                        <SwitchBasic
                          checked={theme === "heart"}
                          onCheckedChange={(e) => setTheme(e.checked ? "heart" : "carrot")}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors border-b border-border/50">
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Performance</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">Toggle high quality animated graphics</span>
                    </div>
                    {mounted && (
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-primary">
                          {highQuality ? "High Quality" : "Performance"}
                        </span>
                        <SwitchBasic
                          checked={highQuality}
                          onCheckedChange={(e) => setHighQuality(e.checked)}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleEnterProfile}
                    className="w-full flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors border-b border-border/50 text-left"
                  >
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Your Profile</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">Change your username, age, gender and password</span>
                    </div>
                    <UserIcon size={18} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={handleEnterSecurity}
                    className="w-full flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors border-b border-border/50 text-left"
                  >
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Security</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">
                        {user?.security_question ? "Update your security question" : "Set a security question to recover your account"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {!user?.security_question && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                      )}
                      <ShieldCheck size={18} className="text-muted-foreground" />
                    </div>
                  </button>
                  <div className="flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors border-b border-border/50">
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Sounds</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">Turn sound effects on or off</span>
                    </div>
                    <SwitchBasic checked={soundEnabled} onCheckedChange={(e) => setSoundEnabled(e.checked)} />
                  </div>
                  <div className="flex justify-between items-center py-4 px-4 hover:bg-muted/50 rounded-2xl transition-colors">
                    <div>
                      <span className="text-sm font-bold text-foreground block mb-1">Music</span>
                      <span className="text-xs font-medium text-muted-foreground opacity-60">Turn background music on or off</span>
                    </div>
                    <SwitchBasic checked={musicEnabled} onCheckedChange={(e) => setMusicEnabled(e.checked)} />
                  </div>
                </div>
              </motion.div>
            )}
            {view === "profile" && (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-card/60 border border-border p-6 sm:p-8 rounded-[40px] shadow-sm relative z-10"
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground ml-1">Username</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-muted/40 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground ml-1">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-muted/40 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Gender</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTrait("male")}
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all border ${trait === "male" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/60"}`}
                      >
                        Male
                      </button>
                      <button
                        onClick={() => setTrait("female")}
                        className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all border ${trait === "female" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/60"}`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground ml-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Leave blank to keep"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSaving}
                          className="w-full bg-muted/40 border-none rounded-2xl px-5 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground ml-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Must match new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isSaving}
                          className={`w-full bg-muted/40 border rounded-2xl px-5 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                            confirmPassword && password !== confirmPassword
                              ? "border-red-500/50 focus:ring-red-500/50"
                              : confirmPassword && password === confirmPassword
                              ? "border-emerald-500/50"
                              : "border-transparent"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-400 font-bold ml-1">Passwords do not match</p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-xs text-emerald-400 font-bold ml-1">Passwords match ✓</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-6 flex flex-col md:flex-row gap-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || (!!confirmPassword && password !== confirmPassword)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={() => setView("settings")}
                      disabled={isSaving}
                      className="flex-1 bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isSaving}
                      className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/40"
                    >
                      <Trash2 size={16} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {view === "security" && (
              <motion.div
                key="security-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-card/60 border border-border p-6 sm:p-8 rounded-[40px] shadow-sm relative z-10"
              >
                <div className="space-y-6">
                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 px-5 py-4">
                    <p className="text-xs font-bold text-emerald-400 mb-1">Why set a security question?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your security question lets you recover your account if you forget your password. Keep the answer memorable but hard to guess.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Security Question</label>
                    <input
                      type="text"
                      placeholder="e.g. What was my first pet's name?"
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      disabled={isSaving}
                      className="w-full bg-muted/40 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Security Answer</label>
                    <div className="relative">
                      <input
                        type={showAnswer ? "text" : "password"}
                        placeholder={user?.security_question ? "Leave blank to keep current answer" : "Enter your answer"}
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-muted/40 border-none rounded-2xl px-5 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAnswer((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-6 flex flex-col md:flex-row gap-4">
                    <button
                      onClick={handleSaveSecurity}
                      disabled={isSaving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {isSaving ? "Saving..." : "Save Security"}
                    </button>

                    <button
                      onClick={() => setView("settings")}
                      disabled={isSaving}
                      className="flex-1 bg-muted/40 hover:bg-muted/60 text-foreground font-bold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isSaving && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border p-6 rounded-3xl shadow-xl max-w-sm w-full z-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Delete Account</h3>
                <p className="text-sm text-muted-foreground font-medium mb-8">
                  Are you sure you want to delete your account? You will lose access to your profile.
                </p>
                <div className="flex flex-col sm:flex-row w-full gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSaving}
                    className="flex-1 px-4 py-4 bg-muted/40 hover:bg-muted/60 text-foreground font-bold rounded-2xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving}
                    className="flex-1 px-4 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] flex justify-center items-center gap-2"
                  >
                    {isSaving ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}