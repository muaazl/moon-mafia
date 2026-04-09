import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimatedBackground } from './AnimatedBackground';
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
            // Not logged in, redirect to login unless already there
            if (location.pathname !== '/') {
                navigate('/');
            }
        }
    }, [isInitialized, isLoading, user, navigate, location]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-background text-foreground">
                <AnimatedBackground />
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

    // If we are at the login page and we ARE logged in, we shouldn't show it — redirect to start
    if (user && location.pathname === '/') {
        // Actually, LoginScreen is not wrapped in AuthGuard in standard implementations
        // but if it is, we redirect out. In routes.ts I shouldn't wrap LoginScreen.
    }

    return <>{children}</>;
}
