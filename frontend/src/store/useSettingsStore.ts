import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    highQuality: boolean;
    setHighQuality: (enabled: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
}

const store = create<SettingsState>()(
    persist(
        (set) => ({
            highQuality: true,
            setHighQuality: (enabled) => set({ highQuality: enabled }),
            soundEnabled: true,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            musicEnabled: true,
            setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
        }),
        {
            name: 'moon-mafia-settings',
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                let cleanup: (() => void) | undefined;

                const initBatteryListener = async () => {
                    try {
                        const battery = await navigator.getBattery?.();
                        if (battery) {
                            const updateQuality = () => {
                                if (!battery.charging) {
                                    state.setHighQuality(false);
                                }
                            };

                            battery.addEventListener('chargingchange', updateQuality);
                            cleanup = () => battery.removeEventListener('chargingchange', updateQuality);

                            updateQuality();
                        }
                    } catch (e) {
                    }
                };

                initBatteryListener();
                return () => { if (cleanup) cleanup(); };
            }
        }
    )
);

export const useSettingsStore = store;
