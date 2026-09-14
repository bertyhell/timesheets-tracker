import './Dropdown.css';
import React, { useCallback, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { useDismiss } from '../../helpers/use-dismiss';

interface DropdownProps {
  label: ReactNode;
  className?: string;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}

export function Dropdown({ label, className, panelClassName, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, [ref]);

  return (
    <div className={`c-dropdown${className ? ' ' + className : ''}`} ref={ref}>
      <button
        type="button"
        className="c-dropdown__trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
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
