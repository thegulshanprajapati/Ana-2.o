
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/AppContext';
import { ChatWidget } from '@/components/ChatWidget';
import { PageTransition } from '@/components/PageTransition';
import { VisitTracker } from '@/components/VisitTracker';

import { useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
        <head>
          <title>My Ana AI</title>
          <meta name="description" content="Your personal AI assistant" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
        </head>
        <AppProvider>
          <body className="font-body antialiased">
            <div className="ana-app-shell">
              <div className="ana-ambient-layer" aria-hidden="true" />
              <PageTransition>{children}</PageTransition>
              <VisitTracker />
              <ChatWidget />
              <Toaster />
            </div>
          </body>
        </AppProvider>
    </html>
  );
}
