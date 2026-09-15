import './ContextMenu.css';
import React, { type ReactNode, useRef } from 'react';

import { useDismiss } from '../../helpers/use-dismiss';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // A context menu is only ever rendered while it is open.
  useDismiss(true, onClose, [menuRef]);

  return (
    <div ref={menuRef} className="c-context-menu" style={{ top: position.y, left: position.x }}>
      {items.map((item, index) => (
        <button
          key={index}
          className={
            'c-context-menu__item' +
            (item.variant === 'danger' ? ' c-context-menu__item--danger' : '')
          }
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          <span className="c-context-menu__icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
