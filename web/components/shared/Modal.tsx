import { h, Fragment } from 'preact';
import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import styles from './Modal.module.css';

interface ModalProps {
  onClose: () => void;
  children: ComponentChildren;
  title?: string;
  className?: string;
}

/**
 * A robust Modal component that uses Portals to avoid DOM hierarchy issues
 * such as the "Node.insertBefore: Argument 1 is not an object" error in Preact.
 */
export function Modal({ onClose, children, title, className = "" }: ModalProps) {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or find a stable modal container outside the app tree
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);

    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!modalRoot) return null;

  const content = (
    <div class={`${styles.modalPortalWrapper} ${className}`}>
      <div class={styles.modalOverlay} onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}>
        <div class={styles.modalContainer}>
          <button class={styles.modalClose} onClick={onClose}>&#x2715;</button>
          {title && <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, modalRoot);
}
