'use client';

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}

export function ImageModal({ isOpen, onClose, imageUrl }: ImageModalProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ease-out",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onTransitionEnd={() => !isOpen && setIsAnimating(false)}
        >
            {/* Blurred Backdrop */}
            <div
                className="absolute inset-0 bg-background/40 backdrop-blur-md cursor-zoom-out"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-4 transition-transform duration-200 ease-out",
                    isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                )}
            >
                {/* Header Controls */}
                <div className="absolute -top-14 right-0 flex items-center gap-3">
                    <a
                        href={imageUrl}
                        download="fluxchat-image"
                        className="p-3 bg-white hover:bg-white/90 text-[#007AFF] rounded-full transition-all active:scale-90 shadow-lg shadow-black/10 flex items-center justify-center"
                        title="Download Image"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download size={22} strokeWidth={2.5} />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-3 bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-full transition-all active:scale-90 shadow-lg shadow-[#007AFF]/20 flex items-center justify-center"
                        title="Close"
                    >
                        <X size={22} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Image Container */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200">
                    <img
                        src={imageUrl}
                        alt="Viewed content"
                        className="w-full h-full object-contain bg-black/20"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    );
}
