import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DialogContext = createContext(null);

// confirm({ title, message, confirmLabel, cancelLabel, danger }) -> Promise<boolean>
// alert({ title, message, okLabel }) -> Promise<void>
export const useDialogs = () => useContext(DialogContext);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const open = useCallback((options) => {
    resolver.current?.(false); // новий діалог закриває попередній
    return new Promise((resolve) => {
      resolver.current = resolve;
      setDialog(options);
    });
  }, []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const api = useMemo(
    () => ({
      confirm: (options) => open({ ...options, kind: 'confirm' }),
      alert: (options) => open({ ...options, kind: 'alert' }).then(() => undefined),
    }),
    [open],
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && <Modal dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
}

function Modal({ dialog, onClose }) {
  const { kind, title, message, danger = false, confirmLabel = 'Так', cancelLabel = 'Скасувати', okLabel = 'Зрозуміло' } = dialog;
  const cardRef = useRef(null);
  const cancelRef = useRef(null);
  const okRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Для небезпечної дії фокус одразу на «Скасувати», щоб випадковий Enter нічого не видалив.
    (kind === 'confirm' && danger ? cancelRef : okRef).current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose(false);
      } else if (event.key === 'Tab') {
        const buttons = [...cardRef.current.querySelectorAll('button')];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [kind, danger, onClose]);

  return (
    <div className="modal-backdrop no-print" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <div ref={cardRef} className="modal" role={kind === 'alert' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-text">
        <h2 id="modal-title">{title}</h2>
        <p id="modal-text">{message}</p>
        <div className="modal-actions">
          {kind === 'confirm' && (
            <button ref={cancelRef} type="button" className="btn" onClick={() => onClose(false)}>
              {cancelLabel}
            </button>
          )}
          <button ref={okRef} type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => onClose(true)}>
            {kind === 'confirm' ? confirmLabel : okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
