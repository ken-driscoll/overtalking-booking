import { useState, useEffect, useRef } from 'react';
import type { Slot } from '../hooks/useSlots.ts';
import { theme } from '../App.tsx';
import { STEPHEN_KING_MOVIES } from '../data/stephenKingMovies.ts';

interface Props {
  slot: Slot;
  onClose: () => void;
  onBooked: (zoomUrl?: string) => void;
}

export default function BookingModal({ slot, onClose, onBooked }: Props) {
  const isOctober = theme.id === 'october';
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedMovies, setBookedMovies] = useState<string[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(isOctober);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableMovies = STEPHEN_KING_MOVIES.filter((m) => !bookedMovies.includes(m));

  const timeLabel = new Date(slot.start).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  });

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 300);
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    // October only: hide films already booked within ±2 months. On failure, fall
    // back to the full list so booking still works.
    if (!isOctober) return;
    let active = true;
    fetch('/api/booked-movies')
      .then((r) => (r.ok ? r.json() as Promise<string[]> : []))
      .then((data) => { if (active) setBookedMovies(data); })
      .catch(() => { /* keep full list */ })
      .finally(() => { if (active) setMoviesLoading(false); });
    return () => { active = false; };
  }, [isOctober]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotStart: slot.start, slotEnd: slot.end, topic }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Booking failed');
      }
      const data = await res.json() as { zoomJoinUrl?: string };
      onBooked(data.zoomJoinUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl animate-slide-up">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        <h2 className="font-display text-2xl text-ot-black mb-1">Confirm Booking</h2>
        <p className="text-gray-500 text-sm mb-6">{timeLabel}</p>

        <label className="block mb-2 text-sm font-semibold text-ot-black">
          {isOctober ? 'Movie' : 'Movie or topic'}
        </label>
        {isOctober ? (
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-ot-black focus:outline-none focus:border-ot-black transition-colors mb-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            <option value="" disabled>
              {moviesLoading ? 'Loading films…' : 'Choose a movie…'}
            </option>
            {availableMovies.map((movie) => (
              <option key={movie} value={movie}>
                {movie}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Movie title (optional)"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-ot-black placeholder-gray-400 focus:outline-none focus:border-ot-black transition-colors mb-6"
          />
        )}

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || (isOctober && !topic)}
          className="w-full bg-ot-yellow text-ot-onbg font-display text-lg rounded-xl py-4 disabled:opacity-50 active:scale-95 transition-transform shadow-lg"
        >
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 text-sm py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
