export const CATEGORY_KEYS = [
  "Starter",
  "MainCourse",
  "Dessert",
  "Beverage",
  "Side",
] as const

export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  Starter: "Entrée",
  MainCourse: "Plat principal",
  Dessert: "Dessert",
  Beverage: "Boisson",
  Side: "Accompagnement",
}
