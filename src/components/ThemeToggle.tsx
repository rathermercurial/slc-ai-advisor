/**
 * ThemeToggle Component
 *
 * Morphing gradient toggle with sun/moon icons.
 * - Light mode: Warm sunrise gradient with sun icon
 * - Dark mode: Cool twilight gradient with moon icon
 * - Smooth gradient transition on toggle
 */

import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === 'light';

  return (
    <button
      className={`theme-toggle-gradient ${isLight ? 'light' : 'dark'}`}
      onClick={onToggle}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="theme-toggle-icon-wrapper">
        {isLight ? (
          <Sun size={16} className="theme-icon" />
        ) : (
          <Moon size={16} className="theme-icon" />
        )}
      </span>
    </button>
  );
}
