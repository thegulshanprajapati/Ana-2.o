"use client";

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { rooms } from '@/lib/communityMock';
import { useCommunityStore } from '@/store/communityStore';
import RoomCard from './RoomCard';
import FilterPills from './FilterPills';

const RoomsSection = () => {
  const { searchQuery, setSearchQuery } = useCommunityStore(state => ({
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery
  }));

  const filteredRooms = useMemo(() => {
    return rooms.filter(room =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <section className="my-8 md:my-12">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            className="pl-9 border-[var(--community-card-border)] bg-[var(--community-surface)] text-foreground placeholder:text-[color:var(--community-muted)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterPills />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredRooms.map(room => (
          <RoomCard key={room.slug} room={room} />
        ))}
      </div>
    </section>
  );
};

export default RoomsSection;
