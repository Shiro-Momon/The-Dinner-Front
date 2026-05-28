export const CATEGORY_IDS = [0, 1, 2, 3, 4] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export const CATEGORY_LABEL: Record<number, string> = {
  0: "Entrée",
  1: "Plat principal",
  2: "Dessert",
  3: "Boisson",
  4: "Accompagnement",
}
