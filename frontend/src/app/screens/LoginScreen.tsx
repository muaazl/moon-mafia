import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";
import { UserResponse } from "../../lib/types";
import { Input } from "../components/ui/input";
import PasswordInput from "../components/ui/password-input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { API_ROUTES } from "../../lib/constants";

const TIPS = [
  { label: "PRO TIP", value: "Hype when hearts dominate the feed. Purge when carrots take over." },
  { label: "STRATEGY", value: "Use BET when you're confident — high risk, high reward." },
  { label: "MINI GAMES", value: "Run mini-games between rounds to stack extra cash before re-entering." },
  { label: "HINT", value: "Reveal Hint briefly shows the image — useful when the feed fades too fast." },
  { label: "STREAK", value: "Win multiple rounds in a row to build a streak. Streaks multiply payouts." },
  { label: "HARD MODE", value: "Hard difficulty fades the image in a split second. Choose your settings wisely." },
  { label: "LOAN", value: "Mini-game loans are a lifeline — but remember to pay them back double." },
  { label: "SOCIAL", value: "Feeling generous? You can tip your fellow players directly from the leaderboard." },
];

function LeftPanel() {
  const [tipIndex, setTipIndex] = useState(0);
  const [tips, setTips] = useState([...TIPS]);

  useEffect(() => {
    // Fetch an extra quote from our backend to add to the tips pool
    api.get<{ content: string; author: string }>(API_ROUTES.AUTH.QUOTE)
      .then(res => {
        if (res.data) {
          setTips(prev => [...prev, { label: `Quote - ${res.data.author}`, value: res.data.content }]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips]);

  const tip = tips[tipIndex];

  return (
    <div className="hidden lg:flex flex-col justify-between h-full w-1/2 p-12 xl:p-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="inline-block px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="text-xs font-bold text-emerald-400">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return "Good morning";
              if (hour < 17) return "Good afternoon";
              if (hour < 21) return "Good evening";
              return "Good night";
            })()}
          </span>
        </div>
        <h1 className="text-6xl xl:text-7xl font-black text-foreground tracking-tighter glow-emerald mb-4">
          Moon Mafia
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md leading-relaxed font-medium">
          The high-stakes strategy game where every decision shapes your empire.
          Outmaneuver rivals, control the market, dominate the table.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-12 overflow-hidden"
      >
        <div className="rounded-3xl border border-white/[0.06] bg-black/25 p-8 xl:p-10 shadow-2xl relative min-h-[220px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-x-8 inset-y-8 xl:inset-x-10 xl:inset-y-10"
            >
              <span className="text-xs font-bold text-emerald-400 mb-4 block">
                {tip.label}
              </span>
              <p className="text-lg xl:text-xl font-bold text-foreground leading-relaxed">
                {tip.value}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-1.5 mt-auto absolute bottom-8 left-8 xl:bottom-10 xl:left-10 z-10">
            {tips.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === tipIndex
                    ? "w-6 bg-emerald-500"
                    : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regGender, setRegGender] = useState("male");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [forgotUsername, setForgotUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post<UserResponse>(API_ROUTES.AUTH.LOGIN, {
        username: loginUsername,
        password: loginPassword,
      });
      setUser(data);
      toast.success("Signed in successfully", { description: "Welcome back!" });
      navigate("/start");
    } catch (error: any) {
      toast.error("Sign in failed", { description: error.response?.data?.detail || "Invalid username or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (name: string) => {
    if (!name) return;
    try {
      await api.get(API_ROUTES.AUTH.SECURITY_QUESTION(name));
      setUsernameError("This username is already taken.");
    } catch (error: any) {
      if (error.response?.status === 404) {
        setUsernameError("");
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) {
      toast.error("Invalid Username", { description: "Please choose a different username." });
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error("Error", { description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.AUTH.REGISTER, {
        name: regName,
        age: parseInt(regAge, 10) || 0,
        gender: regGender,
        password: regPassword,
      });

      const { data } = await api.post<UserResponse>(API_ROUTES.AUTH.LOGIN, {
        username: regName,
        password: regPassword,
      });
      setUser(data);
      toast.success("Account created", { description: "Welcome to Moon Mafia." });
      navigate("/start");
    } catch (error: any) {
      toast.error("Registration failed", { description: error.response?.data?.detail || "Could not create account" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.get<{ security_question?: string }>(API_ROUTES.AUTH.SECURITY_QUESTION(forgotUsername));
      if (data.security_question) {
        setSecurityQuestion(data.security_question);
        setForgotStep(2);
      } else {
        toast.error("No Security Question", { description: "This account hasn't set up a security question yet." });
      }
    } catch (error: any) {
      toast.error("User not found", { description: error.response?.data?.detail || "Could not find that operative." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== newConfirmPassword) {
      toast.error("Mismatch", { description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.AUTH.RESET_PASSWORD, {
        username: forgotUsername,
        security_answer: securityAnswer,
        new_password: newPassword,
      });
      toast.success("Identity Restored", { description: "Your password has been reset." });
      setView("login");
      setForgotStep(1);
      setForgotUsername("");
      setSecurityAnswer("");
      setNewPassword("");
      setNewConfirmPassword("");
    } catch (error: any) {
      toast.error("Reset Failed", { description: error.response?.data?.detail || "Invalid answer or request." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">


      <LeftPanel />

      {/* Right Form Panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 relative z-10 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h1 className="lg:hidden text-5xl font-black text-foreground mb-3 tracking-tight glow-emerald">
              Moon Mafia
            </h1>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {view === "login" ? "Sign In" : view === "register" ? "Create Account" : "Recover Identity"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {view === "login"
                ? "Sign in to your account to continue."
                : view === "register"
                  ? "Create a new account to get started."
                  : "Reset your password using your security question."}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <AnimatePresence mode="wait">
              {view === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-sm text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 px-2 py-1 rounded transition-all"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("register")}
                      className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      Create Account
                    </button>
                  </p>
                </motion.form>
              ) : view === "register" ? (
                <motion.form
                  key="register"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Username</Label>
                    <Input
                      id="reg-name"
                      placeholder="Choose a username"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      onBlur={() => checkUsernameAvailability(regName)}
                      className={usernameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                      required
                    />
                    {usernameError && (
                      <p className="text-xs font-bold text-red-500 ml-1">
                        {usernameError}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-age">Age</Label>
                      <Input
                        id="reg-age"
                        type="number"
                        placeholder="e.g. 22"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <RadioGroup
                        value={regGender}
                        onValueChange={setRegGender}
                        className="flex gap-2"
                      >
                        {(["male", "female"] as const).map((g) => (
                          <div key={g} className="flex-1">
                            <RadioGroupItem value={g} id={`g-${g}`} className="sr-only" />
                            <Label
                              htmlFor={`g-${g}`}
                              className={`flex h-9 items-center justify-center rounded-md border text-sm font-medium capitalize cursor-pointer transition-colors ${regGender === g
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                                : "border-input text-foreground hover:bg-accent"
                                }`}
                            >
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <PasswordInput
                      placeholder="Create a password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <PasswordInput
                      placeholder="Repeat your password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 mt-2"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={forgotStep === 1 ? handleFetchQuestion : handleResetPassword}
                  className="space-y-4"
                >
                  {forgotStep === 1 ? (
                    <div className="space-y-2">
                      <Label htmlFor="forgot-username">Username</Label>
                      <Input
                        id="forgot-username"
                        placeholder="Enter your username"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <Label className="text-xs text-emerald-500/70">Security Question</Label>
                        <p className="text-sm font-bold text-foreground mt-1">{securityQuestion}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="security-answer">Your Answer</Label>
                        <Input
                          id="security-answer"
                          placeholder="Answer your question"
                          value={securityAnswer}
                          onChange={(e) => setSecurityAnswer(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <PasswordInput
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-confirm-password">Confirm New Password</Label>
                        <PasswordInput
                          placeholder="Repeat new password"
                          value={newConfirmPassword}
                          onChange={(e) => setNewConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                  >
                    {isLoading
                      ? forgotStep === 1 ? "Searching..." : "Resetting..."
                      : forgotStep === 1 ? "Next" : "Reset Password"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Remembered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setForgotStep(1);
                      }}
                      className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}