// utils/cn.js - Utility for conditional classes
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

