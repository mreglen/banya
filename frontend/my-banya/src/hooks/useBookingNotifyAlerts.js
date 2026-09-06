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
    const now = ctx.currentTime;

    const beep = (start, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    beep(now, 880, 0.12);
    beep(now + 0.16, 1175, 0.14);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
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
