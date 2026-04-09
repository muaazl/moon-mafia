import { useSettingsStore } from "../store/useSettingsStore";
import { clickSound, hoverSound, betSound, winSound, loseSound, gameOverSound, miniWinSound, miniLoseSound } from "../utils/sound";

export const playSound = (sound: "click" | "win" | "lose" | "hover" | "bet" | "gameover" | "miniwin" | "minilose") => {
  // Use settings store to check if sound is enabled
  const { soundEnabled } = useSettingsStore.getState();
  if (!soundEnabled) return;

  try {
    switch (sound) {
      case "click":
        clickSound();
        break;
      case "hover":
        hoverSound();
        break;
      case "bet":
        betSound();
        break;
      case "win":
        winSound();
        break;
      case "lose":
        loseSound();
        break;
      case "gameover":
        gameOverSound();
        break;
      case "miniwin":
        miniWinSound();
        break;
      case "minilose":
        miniLoseSound();
        break;
    }
  } catch (error) {
    // ignore
  }
};

export const playHaptic = (style: "light" | "medium" | "heavy") => {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    try {
        switch (style) {
        case "light":
            window.navigator.vibrate(20);
            break;
        case "medium":
            window.navigator.vibrate(50);
            break;
        case "heavy":
            window.navigator.vibrate([100, 50, 100]);
            break;
        }
    } catch(e) {}
  }
};