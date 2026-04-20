import { useState } from 'react';
import { useSlots } from '../hooks/useSlots.ts';
import type { Slot } from '../hooks/useSlots.ts';
import BookingModal from './BookingModal.tsx';
import type { User } from '../App.tsx';

interface Props {
  user: User;
  onSignOut: () => void;
}

export default function SlotPicker({ user, onSignOut }: Props) {
  const { groups, loading, error, refetch } = useSlots();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState(false);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    onSignOut();
  };

  if (booked) {
    return (
      <div className="min-h-dvh bg-ot-yellow flex flex-col items-center justify-center px-6 text-center gap-6">
        <img src="/images/ot-cover.png" alt="Overtalking" className="w-40 h-40 rounded-2xl shadow-xl" />
        <div>
          <h2 className="font-display text-3xl text-ot-black">You're booked!</h2>
          <p className="mt-2 text-ot-black/70 text-base">
            Check your email for a calendar invite from Ken &amp; CJ.
          </p>
        </div>
        <button
          onClick={() => { setBooked(false); refetch(); }}
          className="bg-ot-black text-white font-semibold rounded-xl px-8 py-3 active:scale-95 transition-transform"
        >
          View more slots
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ot-yellow flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ot-yellow/95 backdrop-blur-sm px-4 pt-safe-top pt-4 pb-3 border-b border-ot-black/10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/ot-favicon.png" alt="" className="w-9 h-9 rounded-lg" />
            <div>
              <p className="font-display text-lg text-ot-black leading-none">Overtalking</p>
              <p className="text-xs text-ot-black/60 font-medium">Book a recording</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-ot-black/60 font-medium py-1 px-3 rounded-lg hover:bg-ot-black/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div className="px-4 pt-5 pb-2 max-w-lg mx-auto w-full">
        <p className="text-ot-black font-semibold text-base">
          Hey {user.name.split(' ')[0]}! Pick a time below.
        </p>
        <p className="text-ot-black/60 text-sm mt-0.5">
          All times in Central Time. Sessions are 1 hour.
        </p>
      </div>

      {/* Slot list */}
      <main className="flex-1 px-4 pb-10 max-w-lg mx-auto w-full">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-ot-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm text-center mt-4">
            {error}
            <button onClick={refetch} className="block mt-2 font-semibold underline mx-auto">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="text-center py-16 text-ot-black/60">
            <p className="text-lg font-semibold">No slots available right now.</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.dateLabel} className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ot-black/50 mb-2 px-1">
              {group.dateLabel}
            </h3>
            <div className="flex flex-col gap-2">
              {group.slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className="w-full bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="text-left">
                    <p className="font-semibold text-ot-black text-base">{slot.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">1 hour · Central Time</p>
                  </div>
                  <span className="bg-ot-yellow text-ot-black text-sm font-bold rounded-xl px-4 py-2">
                    Book
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => { setSelectedSlot(null); setBooked(true); }}
        />
      )}
    </div>
  );
}
