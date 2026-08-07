import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

const light = {
  paper: '#F6F0E4',
  paperDark: '#EDE4D0',
  card: '#FFFDF7',
  ink: '#26221C',
  inkLight: '#8A8177',
  inkFaint: '#C9C0AE',
  vermillion: '#BE3B2E',
  vermillionDark: '#9C2F24',
  gold: '#B98A2F',
  jade: '#3E7C59',
  grid: '#DAC9AC',
  traceGuide: '#E8DCC2',
};

const dark: typeof light = {
  paper: '#1C1914',
  paperDark: '#2A261F',
  card: '#26221B',
  ink: '#EFE8DA',
  inkLight: '#9A9184',
  inkFaint: '#5A5348',
  vermillion: '#D4574A',
  vermillionDark: '#B03E33',
  gold: '#D0A240',
  jade: '#4E9A72',
  grid: '#3A342A',
  traceGuide: '#4A4438',
};

export type Palette = typeof light;

type ThemeContextValue = {
  colors: Palette;
  isDark: boolean;
  /** resolved mode after auto, for StatusBar */
  resolved: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: light,
  isDark: false,
  resolved: 'light',
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? dark : light,
      isDark,
      resolved: isDark ? 'dark' : 'light',
    }),
    [isDark],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** convenience: current palette */
export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}

// legacy static export kept so existing `import { Colors }` keeps working
// for one-off values; components should migrate to useColors() over time.
export const Colors = light;
