import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function siglaUnidade(unidade: string): string {
  const map: Record<string, string> = {
    goiania: "Goiânia",
    mairipora: "MA",
    pinheiros: "PI",
  };
  return map[unidade?.toLowerCase()] || unidade?.toUpperCase() || "—";
}
