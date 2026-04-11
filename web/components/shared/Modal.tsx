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
      class={`fixed inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5 animate-modalFadeIn ${className}`} 
      onClick={onClose}
    >
      <div 
        class="bg-primary border border-border rounded-[20px] w-full max-w-[420px] p-9 shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-modalSlideUp relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          class="absolute top-4 right-4 bg-secondary border border-border text-secondary rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-lg leading-none transition-colors duration-200 z-10 hover:bg-border hover:text-primary" 
          onClick={onClose} 
          aria-label="Close"
        >
          &#x2715;
        </button>
        {title && <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{title}</h2>}
        <div class="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
