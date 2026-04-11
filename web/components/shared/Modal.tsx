import { h } from 'preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface ModalProps {
  onClose: () => void;
  children: ComponentChildren;
  title?: string;
  className?: string;
}

/**
 * A robust Modal component that uses the native HTML5 <dialog> element.
 * This avoids the need for Portals and preact/compat, providing a more
 * native and accessible way to handle modals.
 */
export function Modal({ onClose, children, title, className = "" }: ModalProps) {
  useEffect(() => {
    // Prevent scrolling on body when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      class={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 sm:p-6 animate-modal-fade-in`} 
      onClick={onClose}
    >
      <div 
        class="bg-base-100 border border-base-content/10 rounded-3xl w-full max-w-lg shadow-2xl animate-modal-slide-up relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          class="absolute top-4 right-4 btn btn-circle btn-ghost btn-sm text-base-content/50 hover:text-base-content hover:bg-base-content/10 transition-all z-20" 
          onClick={onClose} 
          aria-label="Close"
        >
          ✕
        </button>
        {title && (
          <div class="px-8 pt-8 pb-4">
            <h2 class="text-2xl font-black tracking-tight text-base-content">{title}</h2>
          </div>
        )}
        <div class="max-h-[85vh] overflow-y-auto px-8 pb-8 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
