// src/hooks/useBookingNotifyAlerts.js
import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useGetBookingsQuery } from '../redux/slices/apiSlice';
import { useHasAccess } from './useHasAccess';

function playNotifyBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    const beep = (start, freq, duration) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.55, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      gain.connect(master);

      // Два осциллятора — звук громче и заметнее
      [freq, freq * 2].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'square' : 'sine';
        osc.frequency.value = f;
        const partial = ctx.createGain();
        partial.gain.value = i === 0 ? 0.55 : 0.35;
        osc.connect(partial);
        partial.connect(gain);
        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    };

    beep(now, 880, 0.16);
    beep(now + 0.2, 1175, 0.18);
    beep(now + 0.42, 1319, 0.2);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch {
    /* ignore autoplay / unsupported */
  }
}

/**
 * Звук + toast при росте числа непрочитанных заявок с сайта.
 * Только при праве bookings:notify (не выдаётся директору автоматически).
 */
export function useBookingNotifyAlerts() {
  const hasAccess = useHasAccess();
  const canNotify = hasAccess('bookings:notify');
  const prevCountRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  const { unreadCount } = useGetBookingsQuery(undefined, {
    skip: !canNotify,
    pollingInterval: canNotify ? 12000 : 0,
    selectFromResult: ({ data }) => ({
      unreadCount: (data || []).filter((booking) => !booking.is_read).length,
    }),
  });

  useEffect(() => {
    if (!canNotify) return undefined;

    const unlock = () => {
      audioUnlockedRef.current = true;
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [canNotify]);

  useEffect(() => {
    if (!canNotify) {
      prevCountRef.current = null;
      return;
    }

    if (typeof unreadCount !== 'number') return;

    if (prevCountRef.current === null) {
      prevCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevCountRef.current) {
      const added = unreadCount - prevCountRef.current;
      if (audioUnlockedRef.current) {
        playNotifyBeep();
      }
      toast(
        added === 1
          ? 'Новая заявка с сайта'
          : `Новые заявки с сайта: +${added}`,
        { icon: '🔔', duration: 5000 }
      );
    }

    prevCountRef.current = unreadCount;
  }, [unreadCount, canNotify]);
}

export default useBookingNotifyAlerts;
