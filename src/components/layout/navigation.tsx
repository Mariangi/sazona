import type { ReactNode } from 'react'
import {
  NavBookmark, NavCalendar, NavCart, NavChefHat, NavDice, NavFridge,
  NavHeart, NavHome, NavLeaf, NavSearch, NavUsers,
} from '../ui/NavIcons'

export type NavItem = { to: string; label: string; icon: ReactNode }

/** Barra lateral de desktop: las funciones agrupadas por intención. */
export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Decidir',
    items: [
      { to: '/dashboard', label: 'Inicio', icon: <NavHome /> },
      { to: '/discover', label: 'Descubrí', icon: <NavSearch /> },
      { to: '/random-dinner', label: 'Sorpresa', icon: <NavDice /> },
      { to: '/swipe', label: 'Antojo', icon: <NavHeart /> },
      { to: '/fridge', label: 'Mi heladera', icon: <NavFridge /> },
    ],
  },
  {
    title: 'Organizar',
    items: [
      { to: '/meal-planner', label: 'Menú', icon: <NavCalendar /> },
      { to: '/shopping-lists', label: 'Compras', icon: <NavCart /> },
      { to: '/nutrition', label: 'Nutrición', icon: <NavLeaf /> },
    ],
  },
  {
    title: 'Lo mío',
    items: [
      { to: '/recipes', label: 'Mis recetas', icon: <NavChefHat /> },
      { to: '/saved', label: 'Guardados', icon: <NavBookmark /> },
      { to: '/groups', label: 'Grupos', icon: <NavUsers /> },
    ],
  },
]

/** Secciones que en mobile se agrupan en una sola pestaña, con sub-pestañas arriba. */
export const sections = {
  plan: {
    title: 'Plan',
    tabs: [
      { to: '/meal-planner', label: 'Menú' },
      { to: '/shopping-lists', label: 'Compras' },
      { to: '/nutrition', label: 'Nutrición' },
    ],
  },
  mine: {
    title: 'Mi cocina',
    tabs: [
      { to: '/recipes', label: 'Mis recetas' },
      { to: '/saved', label: 'Guardados' },
      { to: '/groups', label: 'Grupos' },
    ],
  },
} as const

export type SectionKey = keyof typeof sections

function matches(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + '/')
}

/** A qué sección pertenece una ruta (incluye pantallas de detalle, p. ej. /groups/3). */
export function sectionFor(pathname: string): SectionKey | null {
  for (const key of Object.keys(sections) as SectionKey[]) {
    // /recipes/new y /recipes/:id son recetas en general, no "Mi cocina"
    if (key === 'mine' && /^\/recipes\/.+/.test(pathname)) continue
    if (sections[key].tabs.some((t) => matches(pathname, t.to))) return key
  }
  return null
}

/** Las sub-pestañas solo se muestran en la pantalla principal de cada sección, no en los detalles. */
export function isSectionIndex(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, '')
  return Object.values(sections).some((s) => s.tabs.some((t) => t.to === clean))
}
