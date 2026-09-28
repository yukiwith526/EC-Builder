import type { ReactNode, MouseEvent } from 'react'

interface Props {
  active: boolean
  disabled?: boolean
  className?: string
  onSelect: () => void
  children: ReactNode
}

export function Selectable({ active, disabled, className = '', onSelect, children }: Props) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (disabled) return
    onSelect()
  }

  return (
    <div
      className={`selectable ${className} ${active ? 'is-active' : ''} ${disabled ? 'is-locked' : ''}`}
      onClick={handleClick}
      role="presentation"
    >
      {children}
    </div>
  )
}
