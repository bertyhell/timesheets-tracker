import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { useDismiss } from '../../helpers/use-dismiss';

/** One place tagged time can be sent. */
export interface SyncOutput {
  id: string;
  name: string;
  /** Host, path or short explanation shown under the name. */
  meta: string;
  /** Drives the dot: green once the integration is actually usable, grey otherwise. */
  isReady: boolean;
}

interface SyncOutputMenuProps {
  outputs: SyncOutput[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * The "Sync to ▾" picker in the dialog header.
 *
 * Shared by the Productive and Excel CSV dialogs so switching between them is a menu choice inside
 * one dialog rather than two dialogs that happen to look alike.
 */
export function SyncOutputMenu({ outputs, selectedId, onSelect }: SyncOutputMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(isOpen, close, [menuRef]);

  const selected = outputs.find((output) => output.id === selectedId);

  return (
    <>
      <div className="c-sync-output" ref={menuRef}>
        <button
          type="button"
          className="c-sync-output__trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
        >
          {selected?.name ?? 'Choose a target'}
          <ChevronDown size={15} />
        </button>
        {isOpen && (
          <div className="c-sync-output__menu">
            {outputs.map((output) => (
              <button
                type="button"
                key={output.id}
                className={
                  'c-sync-output__option' + (output.id === selectedId ? ' is-selected' : '')
                }
                onClick={() => {
                  onSelect(output.id);
                  setIsOpen(false);
                }}
              >
                <span className={`c-sync-dot${output.isReady ? ' is-connected' : ''}`} />
                <span className="c-sync-output__option-text">
                  <span className="c-sync-output__option-name">{output.name}</span>
                  <span className="c-sync-output__option-meta">{output.meta}</span>
                </span>
                {output.id === selectedId && <Check size={14} />}
              </button>
            ))}
            <div className="c-sync-output__footnote">Manage in Settings · Integrations</div>
          </div>
        )}
      </div>
      <span className="c-sync-endpoint">
        <span className={`c-sync-dot${selected?.isReady ? ' is-connected' : ''}`} />
        {selected?.meta ?? 'Not configured'}
      </span>
    </>
  );
}
