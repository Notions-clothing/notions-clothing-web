'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show once per session
    const hasSeenSplash = sessionStorage.getItem('notions_splash_seen');
    if (!hasSeenSplash) {
      setVisible(true);
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 1000);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem('notions_splash_seen', 'true');
      }, 1500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FAF9F5] transition-opacity duration-500 ease-out ${
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
