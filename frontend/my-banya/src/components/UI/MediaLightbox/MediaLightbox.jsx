import { useEffect, useCallback } from 'react';
import { isVideoUrl } from '../../../utils/mediaHelpers';

/**
 * @param {{ url: string, isVideo?: boolean, alt?: string }[]} items
 * @param {number | null} index
 * @param {(index: number | null) => void} onClose - pass null to close; or onIndexChange
 */
function MediaLightbox({ items = [], index, onClose, onIndexChange }) {
  const isOpen = index != null && index >= 0 && items.length > 0;
  const current = isOpen ? items[index] : null;
  const isVideo = current
    ? current.isVideo ?? isVideoUrl(current.url)
    : false;

  const goTo = useCallback(
    (nextIndex) => {
      if (!items.length) return;
      const wrapped = ((nextIndex % items.length) + items.length) % items.length;
      onIndexChange?.(wrapped);
    },
    [items.length, onIndexChange]
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (!isOpen || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр медиа"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition p-2 rounded-full hover:bg-white/10"
        aria-label="Закрыть"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 sm:left-4 z-10 text-white/80 hover:text-white transition p-2 sm:p-3 rounded-full hover:bg-white/10"
            aria-label="Предыдущее"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-2 sm:right-4 z-10 text-white/80 hover:text-white transition p-2 sm:p-3 rounded-full hover:bg-white/10"
            aria-label="Следующее"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <div
        className="relative max-w-6xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={current.url}
            src={current.url}
            className="max-w-full max-h-[80vh] rounded-lg bg-black"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={current.url}
            alt={current.alt || `Фото ${index + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        )}

        {items.length > 1 && (
          <p className="mt-3 text-white/70 text-sm">
            {index + 1} / {items.length}
          </p>
        )}
      </div>
    </div>
  );
}

export default MediaLightbox;
