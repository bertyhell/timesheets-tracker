import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  /** Called when the footnote navigates away, so the owning dialog can close behind it. */
  onNavigateAway: () => void;
}

/**
 * The "Sync to ▾" picker in the dialog header.
 *
 * Shared by the Productive and Excel CSV dialogs so switching between them is a menu choice inside
 * one dialog rather than two dialogs that happen to look alike.
 */
export function SyncOutputMenu({
  outputs,
  selectedId,
  onSelect,
  onNavigateAway,
}: SyncOutputMenuProps) {
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
            {/* Reached from a dialog, so the dialog has to come down with the navigation —
                otherwise the settings page opens behind it. */}
            <Link
              to="/settings/integrations"
              className="c-sync-output__footnote"
              onClick={() => {
                setIsOpen(false);
                onNavigateAway();
              }}
            >
              Manage in Settings · Integrations
            </Link>
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
