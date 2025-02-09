import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const metersToMiles = (meters: number) => meters * 0.000621371;

export const secondsToHoursMinutes = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const formatted = `${hours ? hours + " hr " : ""}${minutes} min`;
  return { hours, minutes, formatted };
};
