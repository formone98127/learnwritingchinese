import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

const KEY_V2 = 'strokeapp.progress.v2';
const KEY_V1 = 'strokeapp.progress.v1';

type ProgressState = {
  /** levelId -> completed chars */
  completed: Record<string, string[]>;
  /** levelId -> char -> stars (1..3) */
  stars: Record<string, Record<string, number>>;
  loaded: boolean;
};

type ProgressContextValue = ProgressState & {
  markCharComplete: (levelId: string, char: string, stars?: number) => void;
  resetAll: () => void;
};

const ProgressContext = createContext<ProgressContextValue>({
  completed: {},
  stars: {},
  loaded: false,
  markCharComplete: () => {},
  resetAll: () => {},
});

export function ProgressProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ProgressState>({ completed: {}, stars: {}, loaded: false });

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY_V2);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setState({ completed: parsed.completed ?? {}, stars: parsed.stars ?? {}, loaded: true });
          return;
        } catch {
          // corrupted payload — start fresh
        }
      }
      // migrate v1 (completed only, no stars)
      const old = await AsyncStorage.getItem(KEY_V1);
      if (old) {
        try {
          const completed = JSON.parse(old);
          setState({ completed, stars: {}, loaded: true });
          AsyncStorage.setItem(KEY_V2, JSON.stringify({ completed, stars: {} }));
          AsyncStorage.removeItem(KEY_V1);
          return;
        } catch {
          // fall through
        }
      }
      setState({ completed: {}, stars: {}, loaded: true });
    })();
  }, []);

  const persist = useCallback((completed: ProgressState['completed'], stars: ProgressState['stars']) => {
    setState({ completed, stars, loaded: true });
    AsyncStorage.setItem(KEY_V2, JSON.stringify({ completed, stars }));
  }, []);

  const markCharComplete = useCallback(
    (levelId: string, char: string, stars?: number) => {
      const prevChars = state.completed[levelId] ?? [];
      const completed = prevChars.includes(char)
        ? state.completed
        : { ...state.completed, [levelId]: [...prevChars, char] };
      const prevStars = state.stars[levelId] ?? {};
      const best = Math.max(prevStars[char] ?? 0, stars ?? prevStars[char] ?? 1);
      const starsMap = { ...state.stars, [levelId]: { ...prevStars, [char]: best } };
      persist(completed, starsMap);
    },
    [state, persist],
  );

  const resetAll = useCallback(() => persist({}, {}), [persist]);

  const value = useMemo(
    () => ({ ...state, markCharComplete, resetAll }),
    [state, markCharComplete, resetAll],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
