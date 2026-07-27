'use client'

import './BaseButton.css'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'outline-secondary'
  | 'outline-dark'
  | 'danger'
  | 'outline-primary'

type ButtonSize = 'action' | 'toolbar' | 'form' | 'sm' | 'md' | 'lg'

type BaseButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export default function BaseButton({
  variant = 'primary',
  size = 'toolbar',
  block = false,
  className = '',
  children,
  ...buttonProps
}: BaseButtonProps) {
  const normalizedVariant = variant === 'outline' ? 'outline-secondary' : variant
  const normalizedSize = size === 'sm' ? 'action' : size === 'md' ? 'toolbar' : size === 'lg' ? 'form' : size

  const classes = [
    'btn',
    'base-btn',
    `base-btn--${normalizedVariant}`,
    `base-btn--${normalizedSize}`,
    block ? 'w-100' : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  )
}
