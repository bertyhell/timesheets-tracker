import React, { useRef } from 'react';
import {
  arrow,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  type Placement,
} from '@floating-ui/react';
import './Tooltip.css';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<unknown> }>;
  visible: boolean;
  placement?: Placement;
  className?: string;
}

function Tooltip({ content, children, visible, placement = 'top', className }: TooltipProps) {
  const arrowRef = useRef(null);
  const { refs, floatingStyles, context } = useFloating({
    open: visible,
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  });

  return (
    <>
      {React.cloneElement(children, { ref: refs.setReference })}
      {visible && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={'c-tooltip' + (className ? ' ' + className : '')}
          >
            <FloatingArrow ref={arrowRef} context={context} className="c-tooltip__arrow" />
            <div className="c-tooltip__content">{content}</div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default Tooltip;
