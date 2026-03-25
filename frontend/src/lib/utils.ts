import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatLicensePlate = (value: string) => {
  const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let formatted = '';
  for (let i = 0; i < clean.length; i++) {
    if (i > 0 && i % 2 === 0 && i < 6) formatted += '-';
    formatted += clean[i];
  }
  return formatted.slice(0, 8);
};

export const isValidLicensePlate = (plate: string) => {
  const r1 = /^[A-Z]{2}-\d{2}-\d{2}$/;
  const r2 = /^\d{2}-\d{2}-[A-Z]{2}$/;
  const r3 = /^\d{2}-[A-Z]{2}-\d{2}$/;
  const r4 = /^[A-Z]{2}-\d{2}-[A-Z]{2}$/;
  return r1.test(plate) || r2.test(plate) || r3.test(plate) || r4.test(plate);
};
