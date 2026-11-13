import type { ReactNode } from 'react'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

export type ButtonProps = Omit<AriaButtonProps, 'className' | 'children'> & {
  variant?: 'secondary' | 'primary' | 'quiet' | 'danger'
  size?: 'md' | 'sm'
  /** A Lucide icon element; it sits before the label. */
  icon?: ReactNode
  children: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, children, ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className="fh-btn"
      data-variant={variant === 'secondary' ? undefined : variant}
      data-size={size === 'sm' ? 'sm' : undefined}
    >
      {icon}
      {children}
    </AriaButton>
  )
}
