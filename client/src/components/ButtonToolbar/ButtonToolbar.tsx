import React, { type FC, type ReactNode } from 'react';

import './ButtonToolbar.css';

interface ButtonToolbarProps {
  children?: ReactNode;
}

export const ButtonToolbar: FC<ButtonToolbarProps> = ({ children }) => {
  return (
    <div className="c-button-toolbar flex flex-row gap-0.5 p-0.5 bg-gray-200 rounded-lg">
      {children}
    </div>
  );
};
