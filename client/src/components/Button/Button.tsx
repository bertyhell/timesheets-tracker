import React, { type FC, type ReactNode } from 'react';

import './Button.css';

export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Transparent = 'transparent',
}

export enum ButtonSize {
  Normal = 'normal',
  Small = 'small',
}

export enum ButtonIconPosition {
  Left = 'left',
  Right = 'right',
}

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: ButtonIconPosition;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({
  variant = ButtonVariant.Primary,
  size = ButtonSize.Normal,
  icon,
  iconPosition = ButtonIconPosition.Left,
  onClick,
  disabled,
  className,
  title,
  ariaLabel,
  type = 'button',
  children,
}) => {
  const classes = [
    'c-button',
    `c-button--${variant}`,
    size === ButtonSize.Small ? 'c-button--small' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      type={type}
      title={title}
      aria-label={ariaLabel}
    >
      {icon && iconPosition === ButtonIconPosition.Left && (
        <span className="c-button__icon c-button__icon--left">{icon}</span>
      )}
      {children}
      {icon && iconPosition === ButtonIconPosition.Right && (
        <span className="c-button__icon c-button__icon--right">{icon}</span>
      )}
    </button>
  );
};

export default Button;
