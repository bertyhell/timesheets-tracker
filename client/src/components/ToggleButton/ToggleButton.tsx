import './ToggleButton.css';

import React, { type FC } from 'react';
import Button, { ButtonSize, ButtonVariant } from '../Button/Button';

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
      <Button
        size={ButtonSize.Small}
        className={
          'c-toggle-button__option1 ' + (optionTwoSelected ? '' : 'c-toggle-button--selected')
        }
        onClick={() => onChange(false)}
        variant={optionTwoSelected ? ButtonVariant.Secondary : ButtonVariant.Primary}
      >
        {label1}
      </Button>
      <Button
        size={ButtonSize.Small}
        className={
          'c-toggle-button__option2 ' + (optionTwoSelected ? 'c-toggle-button--selected' : '')
        }
        onClick={() => onChange(true)}
        variant={optionTwoSelected ? ButtonVariant.Primary : ButtonVariant.Secondary}
      >
        {label2}
      </Button>
    </div>
  );
};

export default ToggleButton;
