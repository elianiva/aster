export const THEMES = [
  { id: 'slate', label: 'Slate', color: 'oklch(0.372 0.044 257.287)' },
  { id: 'sky', label: 'Sky', color: 'oklch(0.5 0.134 242.749)' },
  { id: 'blue', label: 'Blue', color: 'oklch(0.488 0.243 264.376)' },
  { id: 'violet', label: 'Violet', color: 'oklch(0.491 0.27 292.581)' },
  { id: 'pink', label: 'Pink', color: 'oklch(0.525 0.223 3.958)' },
  { id: 'red', label: 'Red', color: 'oklch(0.505 0.213 27.518)' },
  { id: 'orange', label: 'Orange', color: 'oklch(0.553 0.195 38.402)' },
  { id: 'emerald', label: 'Emerald', color: 'oklch(0.508 0.118 165.612)' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export function getTheme(): ThemeId {
  const stored = localStorage.getItem('aster-theme');
  if (stored && THEMES.some((t) => t.id === stored)) {
    return stored as ThemeId;
  }
  return 'slate';
}

export function setTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  localStorage.setItem('aster-theme', id);
}

export function initTheme(): void {
  document.documentElement.dataset.theme = getTheme();
}
