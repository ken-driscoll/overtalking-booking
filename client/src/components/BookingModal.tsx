import { useState, useEffect, useRef } from 'react';
import type { Slot } from '../hooks/useSlots.ts';

interface Props {
  slot: Slot;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingModal({ slot, onClose, onBooked }: Props) {
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onBooked();
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
          Movie or topic
        </label>
        <input
          ref={inputRef}
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Movie title (optional)"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-ot-black placeholder-gray-400 focus:outline-none focus:border-ot-black transition-colors mb-6"
        />

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-ot-black text-ot-yellow font-display text-lg rounded-xl py-4 disabled:opacity-50 active:scale-95 transition-transform shadow-lg"
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
