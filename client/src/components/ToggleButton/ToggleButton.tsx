import './ToggleButton.css';

import React, { type FC } from 'react';

interface ToggleButtonProps {
  optionTwoSelected: boolean;
  onChange: (optionTwoSelected: boolean) => void;
  className?: string;
  label1: string;
  label2: string;
}

const ToggleButton: FC<ToggleButtonProps> = ({
  className,
  optionTwoSelected,
  onChange,
  label1,
  label2,
}: ToggleButtonProps) => {
  return (
    <div className={'c-toggle-button ' + (className ?? '')}>
      <button
        type="button"
        className={'c-toggle-button__btn c-toggle-button__btn--left' + (!optionTwoSelected ? ' c-toggle-button__btn--active' : '')}
        onClick={() => onChange(false)}
      >
        {label1}
      </button>
      <button
        type="button"
        className={'c-toggle-button__btn c-toggle-button__btn--right' + (optionTwoSelected ? ' c-toggle-button__btn--active' : '')}
        onClick={() => onChange(true)}
      >
        {label2}
      </button>
    </div>
  );
};

export default ToggleButton;
