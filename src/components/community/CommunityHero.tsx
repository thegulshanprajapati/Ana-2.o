"use client";

import { motion } from 'framer-motion';
import { Plus, Lightbulb, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityStore } from '@/store/communityStore';

const MotionButton = motion(Button);

const CommunityHero = () => {
  const openComposer = useCommunityStore(state => state.openComposer);

  return (
    <section className="text-center py-8 md:py-16">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Community</h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-[color:var(--community-muted)]">
        Ask, share, and build with My Ana AI.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <MotionButton
          onClick={() => openComposer('Discussion')}
          className="border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
          whileHover={{ scale: 1.05, boxShadow: "var(--community-accent-glow)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Plus className="mr-2 h-4 w-4" /> Start Discussion
        </MotionButton>
        <MotionButton
          onClick={() => openComposer('Feature')}
          variant="outline"
          className="border-[var(--community-card-border)] bg-[var(--community-surface)] text-foreground hover:border-primary/50 hover:bg-[var(--community-card-hover)]"
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
        >
          <Lightbulb className="mr-2 h-4 w-4" /> Suggest Feature
        </MotionButton>
        <MotionButton
          onClick={() => openComposer('Bug')}
          variant="outline"
           className="border-[var(--community-card-border)] bg-[var(--community-surface)] text-foreground hover:border-primary/50 hover:bg-[var(--community-card-hover)]"
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
        >
          <Bug className="mr-2 h-4 w-4" /> Report Bug
        </MotionButton>
      </div>
    </section>
  );
};

export default CommunityHero;
