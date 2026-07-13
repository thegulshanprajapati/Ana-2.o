"use client";

import { Button } from '@/components/ui/button';
import { rooms } from '@/lib/communityMock';
import { useCommunityStore, FilterType } from '@/store/communityStore';
import { cn } from '@/lib/utils';

const filters: { label: string, value: FilterType }[] = [
  { label: 'All', value: 'all' },
  ...rooms.map(r => ({ label: r.name, value: r.slug }))
];

const FilterPills = () => {
  const { filter, setFilter } = useCommunityStore(state => ({
    filter: state.filter,
    setFilter: state.setFilter,
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(f => (
        <Button
          key={f.value}
          size="sm"
          variant="ghost"
          onClick={() => setFilter(f.value)}
          className={cn(
            "rounded-full px-3 py-1 text-sm h-auto transition-colors",
            filter === f.value
              ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'
              : 'text-[color:var(--community-muted)] hover:bg-[var(--community-surface)] hover:text-foreground border border-transparent'
          )}
        >
          {f.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterPills;
