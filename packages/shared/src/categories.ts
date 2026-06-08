export const CATEGORIES = [
  'Desayuno',
  'Entrada',
  'Plato principal',
  'Guarnición',
  'Ensalada',
  'Sopa',
  'Postre',
  'Snack',
  'Salsa',
  'Bebida',
  'Sin TACC',
  'Vegano',
  'Vegetariano',
] as const

export type Category = (typeof CATEGORIES)[number]
