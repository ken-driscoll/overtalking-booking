import { useState, useEffect } from 'react';

export interface Slot {
  start: string;
  end: string;
  label: string;
}

export interface GroupedSlots {
  dateLabel: string;
  slots: Slot[];
}

function groupByDate(slots: Slot[]): GroupedSlots[] {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const d = new Date(slot.start);
    const key = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const existing = groups.get(key) ?? [];
    existing.push(slot);
    groups.set(key, existing);
  }
  return Array.from(groups.entries()).map(([dateLabel, slots]) => ({ dateLabel, slots }));
}

export function useSlots() {
  const [groups, setGroups] = useState<GroupedSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = () => {
    setLoading(true);
    setError(null);
    fetch('/api/slots')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load slots');
        return r.json() as Promise<Slot[]>;
      })
      .then((data) => setGroups(groupByDate(data)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSlots, []);

  return { groups, loading, error, refetch: fetchSlots };
}
