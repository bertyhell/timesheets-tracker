import './ToggleButton.scss';

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
    <div className={'c-toggle-button ' + (className ? className : '')}>
      <button
        className={
          'c-button c-button--small c-toggle-button__option1 ' +
          (optionTwoSelected ? '' : 'c-toggle-button--selected')
        }
        onClick={() => onChange(false)}
      >
        {label1}
      </button>
      <button
        className={
          'c-button c-button--small c-toggle-button__option2 ' +
          (optionTwoSelected ? 'c-toggle-button--selected' : '')
        }
        onClick={() => onChange(true)}
      >
        {label2}
      </button>
    </div>
  );
};

export default ToggleButton;
