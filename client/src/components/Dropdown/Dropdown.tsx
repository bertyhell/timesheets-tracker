import './Dropdown.css';
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  label: ReactNode;
  className?: string;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}

export function Dropdown({ label, className, panelClassName, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (evt: MouseEvent) => {
      if (ref.current && !ref.current.contains(evt.target as Node)) setOpen(false);
    };
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`c-dropdown${className ? ' ' + className : ''}`} ref={ref}>
      <button type="button" className="c-dropdown__trigger" onClick={() => setOpen((prev) => !prev)}>
        <span className="c-dropdown__trigger-label">{label}</span>
        <ChevronDown size={14} className={`c-dropdown__chevron${open ? ' is-open' : ''}`} />
      </button>
      {open && (
        <div className={`c-dropdown__panel${panelClassName ? ' ' + panelClassName : ''}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
