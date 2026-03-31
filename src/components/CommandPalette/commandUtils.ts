export function formatKeybinding(binding: string): string {
  return binding
    .split('+')
    .map((part) => {
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'shift') return 'Shift';
      if (part === 'alt') return 'Alt';
      if (part === 'space') return 'Space';
      if (part === 'delete') return 'Del';
      if (part === 'escape') return 'Esc';
      if (part === 'up') return '↑';
      if (part === 'down') return '↓';
      if (part === 'left') return '←';
      if (part === 'right') return '→';
      return part.toUpperCase();
    })
    .join('+');
}

export function commandDisplayName(key: string, t: (k: string, fallback: string) => string): string {
  const i18nKey = `command.${key}`;
  const translated = t(i18nKey, '');
  if (translated && translated !== i18nKey) return translated;

  const lastDot = key.lastIndexOf('.');
  const segment = lastDot >= 0 ? key.substring(lastDot + 1) : key;
  return segment
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
