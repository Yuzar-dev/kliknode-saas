'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevents hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-xl bg-white/40 dark:bg-white/5 animate-pulse" />
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="text-apple-secondary hover:text-apple-textDark dark:hover:text-white w-full h-full flex items-center justify-center rounded-xl transition-all hover:bg-white/40 dark:hover:bg-white/5 relative group overflow-hidden"
            aria-label="Toggle Theme"
        >
            <div className="relative w-[20px] h-[20px] md:w-[22px] md:h-[22px]">
                {/* Sun Icon */}
                <span className={`material-symbols-outlined absolute inset-0 transition-all duration-500 transform ${isDark ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }} translate="no">
                    light_mode
                </span>
                {/* Moon Icon */}
                <span className={`material-symbols-outlined absolute inset-0 transition-all duration-500 transform ${isDark ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }} translate="no">
                    dark_mode
                </span>
            </div>

            {/* Subtle glow effect */}
            <div className={`absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
        </button>
    );
}
