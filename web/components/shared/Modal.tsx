import { h } from 'preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './Modal.module.css';

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
    <div class={`${styles.modalOverlay} ${className}`} onClick={onClose}>
      <div class={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button 
          class={styles.modalClose} 
          onClick={onClose} 
          aria-label="Close"
        >
          &#x2715;
        </button>
        {title && <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{title}</h2>}
        <div class={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
}
