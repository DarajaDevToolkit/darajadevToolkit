import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import toast from "react-hot-toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const errorToast = (message: string | unknown, duration: number = 4000) => {
  toast.error(`Error: ${message}`, {
    duration,
    position: "top-right",
  });
};

export const successToast = (message: string, duration: number = 4000) => {
  toast.success(`Success: ${message}`, {
    duration,
    position: "top-right",
  });
};

export const infoToast = (message: string, duration: number = 4000) => {
  toast(`Info: ${message}`, {
    duration,
    position: "top-right",
  });
};

export const warningToast = (message: string, duration: number = 4000) => {
  toast(`Warning: ${message}`, {
    duration,
    position: "top-right",
  });
};

