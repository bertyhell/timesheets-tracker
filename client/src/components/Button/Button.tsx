import React, { type FC, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
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

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: ButtonIconPosition;
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children?: ReactNode;
} & (
  | {
      to: string;
      onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
      type?: never;
    }
  | {
      to?: never;
      onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
      type?: 'button' | 'submit' | 'reset';
    }
);

const BASE_CLASSES =
  'inline-flex items-center gap-1.5 py-2 px-3.5 m-0 border-0 rounded-lg font-medium text-sm whitespace-nowrap cursor-pointer outline-none transition duration-150 ease-in disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  [ButtonVariant.Primary]:
    'bg-[var(--primary-0)] text-white hover:bg-[var(--primary-1)] focus:shadow-[0_0_0_3px_var(--primary-4)]',
  [ButtonVariant.Secondary]:
    'bg-white text-[var(--gray-700)] border border-[var(--gray-200)] hover:bg-[var(--bg-alternative)] focus:shadow-[0_0_0_3px_var(--primary-4)]',
  [ButtonVariant.Tertiary]:
    'bg-[var(--bg-alternative)] text-[var(--gray-700)] hover:bg-[var(--gray-200)] focus:shadow-[0_0_0_3px_var(--primary-4)]',
  [ButtonVariant.Transparent]:
    'bg-transparent text-[var(--primary-0)] border-0 hover:bg-[var(--bg-alternative)] focus:text-[var(--focus-color)] focus:bg-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  [ButtonSize.Normal]: '',
  [ButtonSize.Small]: 'py-1.5 px-2.5 text-[0.8125rem]',
};

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
  to,
  children,
}) => {
  const classes = [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className ?? '']
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {icon && iconPosition === ButtonIconPosition.Left && (
        <span className="inline-flex items-center">{icon}</span>
      )}
      {children}
      {icon && iconPosition === ButtonIconPosition.Right && (
        <span className="inline-flex items-center">{icon}</span>
      )}
    </>
  );

  if (to !== undefined) {
    return (
      <NavLink
        className={classes}
        to={to}
        onClick={onClick as ((e: React.MouseEvent<HTMLAnchorElement>) => void) | undefined}
        title={title}
        aria-label={ariaLabel}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <button
      className={classes}
      onClick={onClick as ((e: React.MouseEvent<HTMLButtonElement>) => void) | undefined}
      disabled={disabled}
      type={type}
      title={title}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
};

export default Button;
