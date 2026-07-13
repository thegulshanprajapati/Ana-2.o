"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Room } from '@/lib/validators/community';
import Link from 'next/link';

const RoomCard = ({ room }: { room: Room }) => {
  const Icon = room.icon;

  return (
    <motion.div
      className="bg-[var(--community-card-bg)] border border-[var(--community-card-border)] rounded-lg p-5 flex flex-col items-start backdrop-blur-sm"
      whileHover={{ y: -5, boxShadow: 'var(--community-accent-glow)' }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{room.name}</h3>
      </div>
      <p className="text-sm text-[color:var(--community-muted)] flex-grow mb-4">{room.description}</p>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mt-auto -ml-2 text-foreground hover:bg-[var(--community-card-hover)]"
      >
        <Link href={`/community/room/${room.slug}`}>Enter Room</Link>
      </Button>
    </motion.div>
  );
};

export default RoomCard;
