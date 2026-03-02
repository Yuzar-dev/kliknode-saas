'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export function AdminButton({
    children,
    className,
    onClick,
    isLoading = false,
    variant = 'primary',
    disabled,
    ...props
}: AdminButtonProps) {
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        if (isClicked) {
            const timer = setTimeout(() => {
                setIsClicked(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isClicked]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isLoading && !disabled) {
            setIsClicked(true);
            onClick?.(e);
        }
    };

    const variants = {
        primary: {
            base: 'bg-black text-white hover:bg-gray-800 shadow-gray-500/30',
            clicked: 'bg-black text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] border-blue-500/50'
        },
        secondary: {
            base: 'bg-white text-black border border-gray-200 hover:bg-gray-50 shadow-gray-200/50',
            clicked: 'bg-white text-black border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
        },
        danger: {
            base: 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30',
            clicked: 'bg-red-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)]'
        },
        outline: {
            base: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
            clicked: 'bg-transparent border-blue-500/50 text-gray-700 shadow-[0_0_15px_rgba(59,130,246,0.8)]'
        }
    };

    const getVariantClasses = () => {
        const variantConfig = variants[variant as keyof typeof variants] || variants.primary;
        return isClicked ? variantConfig.clicked : variantConfig.base;
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={cn(
                'relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition-all duration-300',
                'focus:outline-none focus:ring-0 outline-none', // Force remove outline
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:scale-[1.02] active:scale-[0.98]', // Subtle scale effect
                'hover:scale-[1.02] active:scale-[0.98]', // Subtle scale effect
                getVariantClasses(),
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
