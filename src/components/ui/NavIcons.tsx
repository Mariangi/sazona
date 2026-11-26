// Íconos de línea para la navegación. Usan `currentColor`, así toman el color del texto.
import type { ReactNode } from 'react'

type Props = { size?: number; className?: string }

function Svg({ size = 24, className, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const NavHome = (p: Props) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Svg>
)
export const NavSearch = (p: Props) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
)
export const NavPlus = (p: Props) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const NavCalendar = (p: Props) => (
  <Svg {...p}><rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M8 2.5v4M16 2.5v4M3 10h18" /></Svg>
)
export const NavChefHat = (p: Props) => (
  <Svg {...p}><path d="M6 14a4 4 0 1 1 2-7.5 4.5 4.5 0 0 1 8 0A4 4 0 1 1 18 14v6H6z" /><path d="M6 17h12" /></Svg>
)
export const NavDice = (p: Props) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
  </Svg>
)
export const NavHeart = (p: Props) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
)
export const NavFridge = (p: Props) => (
  <Svg {...p}><rect x="5" y="2.5" width="14" height="19" rx="3" /><path d="M5 10h14M9 6v1.5M9 13.5v3" /></Svg>
)
export const NavUsers = (p: Props) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2A6.5 6.5 0 0 1 21.5 20" />
  </Svg>
)
export const NavCart = (p: Props) => (
  <Svg {...p}><path d="M3 4h2.5l2.2 11h10.6L21 7.5H6.4" /><circle cx="9.5" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></Svg>
)
export const NavLeaf = (p: Props) => (
  <Svg {...p}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19 13 11" /></Svg>
)
export const NavBookmark = (p: Props) => (
  <Svg {...p}><path d="M6 3.5h12v17l-6-4-6 4z" /></Svg>
)
export const NavChevron = (p: Props) => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
)
export const NavClose = (p: Props) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)
export const NavMore = (p: Props) => (
  <Svg {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></Svg>
)
export const NavCutlery = (p: Props) => (
  <Svg {...p}><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 3.5-3 6.5V13h3v8" /></Svg>
)
