"use client";

import { useEffect } from 'react';
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useCommunityStore } from '@/store/communityStore';
import CommunityHero from '@/components/community/CommunityHero';
import RoomsSection from '@/components/community/RoomsSection';
import FeedSection from '@/components/community/FeedSection';
import ComposerModal from '@/components/community/ComposerModal';
import PostDrawer from '@/components/community/PostDrawer';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
  const { fetchInitialData, error, setError } = useCommunityStore(state => ({
    fetchInitialData: state.fetchInitialData,
    error: state.error,
    setError: state.setError
  }));

  useEffect(() => {
    // We only want to fetch initial data once on mount.
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="community-background-noise flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <CommunityHero />

          {error && (
            <div className="my-8 flex items-center justify-between rounded-lg border border-destructive bg-destructive/20 p-4">
              <p className="text-destructive-foreground">An error occurred: {error}</p>
              <Button variant="destructive" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          <RoomsSection />
          <FeedSection />
        </div>
      </main>
      <ComposerModal />
      <PostDrawer />
      <AppFooter />
    </div>
  );
}
