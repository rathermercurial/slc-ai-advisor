/**
 * ThemeToggle Component
 *
 * Morphing gradient toggle with icons for 4 theme modes.
 * Cycles: light -> dark -> midnight -> daybreak -> light...
 * - Light mode: Warm sunrise gradient with sun icon
 * - Dark mode: Cool twilight gradient with moon icon
 * - Midnight mode: Deep purple gradient with stars icon
 * - Daybreak mode: Soft pink gradient with sunrise icon
 */

import { Sun, Moon, Stars, Sunrise } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'midnight' | 'daybreak';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  onHoverChange?: (text: string | null) => void;
}

const themeIcons: Record<Theme, React.ReactNode> = {
  light: <Sun size={16} className="theme-icon" />,
  dark: <Moon size={16} className="theme-icon" />,
  midnight: <Stars size={16} className="theme-icon" />,
  daybreak: <Sunrise size={16} className="theme-icon" />,
};

const themeLabels: Record<Theme, string> = {
  light: 'dark',
  dark: 'midnight',
  midnight: 'daybreak',
  daybreak: 'light',
};

export function ThemeToggle({ theme, onToggle, onHoverChange }: ThemeToggleProps) {
  const nextTheme = themeLabels[theme];
  const helperText = `Switch to ${nextTheme} mode`;

  return (
    <button
      className={`theme-toggle-gradient ${theme}`}
      onClick={onToggle}
      onMouseEnter={() => onHoverChange?.(helperText)}
      onMouseLeave={() => onHoverChange?.(null)}
      aria-label={helperText}
    >
      <span className="theme-toggle-icon-wrapper">
        {themeIcons[theme]}
      </span>
    </button>
  );
}
