import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  suffix = 'm',
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 1000) / 1000));
  const currentValue = useRef(value);
  currentValue.current = value;
  useEffect(() => setDraft(String(Math.round(value * 1000) / 1000)), [value]);
  function commit() {
    const n = Number(draft);
    if (
      draft.trim() &&
      Number.isFinite(n) &&
      (min === undefined || n >= min) &&
      (max === undefined || n <= max)
    ) {
      if (n !== value) onChange(n);
    } else setDraft(String(value));
    // A domain limit may reject or round the edit. Show the accepted physical value.
    requestAnimationFrame(() => setDraft(String(Math.round(currentValue.current * 1000) / 1000)));
  }
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input
          aria-label={label}
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <small>{suffix}</small>
      </div>
    </label>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
    dialog?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialog) {
        const controls = [
          ...dialog.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, [tabindex="0"]',
          ),
        ].filter((el) => !el.hasAttribute('disabled'));
        const first = controls[0],
          last = controls.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === dialog)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === dialog)
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      prior?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? 'wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Cerrar diálogo" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
