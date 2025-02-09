import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function transformDate(date: string) {
  return date.substring(0, 10).substring(5, 7) 
  + "/" + date.substring(0, 10).substring(8, 10) 
  + "/" + date.substring(0, 10).substring(0, 4);
}
