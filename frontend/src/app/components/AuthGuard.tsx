import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';

import { motion } from 'framer-motion';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading, isInitialized, refreshUser } = useAuthStore();

    useEffect(() => {
        if (!isInitialized) {
            refreshUser();
        }
    }, [isInitialized, refreshUser]);

    useEffect(() => {
        if (isInitialized && !isLoading && !user) {
            if (location.pathname !== '/') {
                navigate('/');
            }
        }
    }, [isInitialized, isLoading, user, navigate, location]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-background text-foreground">

                <div className="z-10 flex gap-3">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="h-12 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40"
                        />
                    ))}
                </div>
                <p className="z-10 text-xs font-bold tracking-widest uppercase text-muted-foreground opacity-50">
                    Authenticating
                </p>
            </div>
        );
    }

    if (user && location.pathname === '/') {
    }

    return <>{children}</>;
}
