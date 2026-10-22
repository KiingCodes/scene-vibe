const HIGH_CONTRAST_CLASS = 'high-contrast-neon';

export const applyHighContrastNeon = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(HIGH_CONTRAST_CLASS, enabled);
};
