'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      const alreadySeen =
        localStorage.getItem('notions_splash_seen') === 'true' ||
        sessionStorage.getItem('notions_splash_seen') === 'true';

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (alreadySeen || prefersReducedMotion) {
        document.documentElement.classList.remove('notions-intro-pending');
        if (onComplete) onComplete();
        return;
      }

      // First time visit: display pre-intro animation
      setVisible(true);
      document.documentElement.classList.add('notions-intro-pending');

      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 1000);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        try {
          localStorage.setItem('notions_splash_seen', 'true');
          sessionStorage.setItem('notions_splash_seen', 'true');
        } catch (e) {}
        document.documentElement.classList.remove('notions-intro-pending');
        if (onComplete) onComplete();
      }, 1500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } catch (e) {
      document.documentElement.classList.remove('notions-intro-pending');
      if (onComplete) onComplete();
    }
  }, [onComplete]);

  // If already seen or not visible, do not render any splash DOM
  if (!visible) return null;

  return (
    <div
      id="notions-pre-intro"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAF9F5] transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="NOTIONS® — Opulent Clothing"
          width={220}
          height={64}
          priority
          className="h-14 w-auto object-contain animate-pulse"
        />
        <div className="mt-4 w-12 h-[2px] bg-[#143728] rounded-full" />
      </div>
    </div>
  );
}
