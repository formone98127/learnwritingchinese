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

const KEY_V3 = 'strokeapp.progress.v3';
const KEY_V2 = 'strokeapp.progress.v2';
const KEY_V1 = 'strokeapp.progress.v1';
const PROFILES_KEY = 'strokeapp.profiles';

export type LessonState = { charIdx: number; phase: string };
export type Profile = { id: string; name: string; avatar: string };

type PerChar = Record<string, Record<string, number>>; // levelId -> char -> x

type ProfileData = {
  /** levelId -> completed chars */
  completed: Record<string, string[]>;
  /** levelId -> char -> stars (1..3) */
  stars: PerChar;
  /** levelId -> last visited position, for resuming */
  lessonState: Record<string, LessonState>;
  /** char -> last accuracy 0..1 (lowest 3 kept avg), for weak-char review */
  charAccuracy: Record<string, number>;
  /** iso date -> completed count, for streak + report */
  activity: Record<string, number>;
  /** char -> epoch ms when last reviewed correctly (SRS) */
  review: Record<string, number>;
};

type ProgressState = {
  data: ProfileData;
  profile: Profile;
  profiles: Profile[];
  loaded: boolean;
};

const EMPTY: ProfileData = {
  completed: {},
  stars: {},
  lessonState: {},
  charAccuracy: {},
  activity: {},
  review: {},
};

const DEFAULT_PROFILES: Profile[] = [{ id: 'p1', name: '我', avatar: '一' }];

type ProgressContextValue = {
  loaded: boolean;
  profile: Profile;
  profiles: Profile[];
  completed: ProfileData['completed'];
  stars: ProfileData['stars'];
  lessonState: ProfileData['lessonState'];
  charAccuracy: ProfileData['charAccuracy'];
  activity: ProfileData['activity'];
  review: ProfileData['review'];
  markCharComplete: (levelId: string, char: string, stars?: number) => void;
  setLessonState: (levelId: string, state: LessonState | null) => void;
  recordAccuracy: (char: string, score: number) => void;
  recordActivity: (char: string) => void;
  markReviewed: (char: string) => void;
  switchProfile: (id: string) => void;
  addProfile: (name: string) => void;
  resetAll: () => void;
};

const ProgressContext = createContext<ProgressContextValue>({
  loaded: false,
  profile: DEFAULT_PROFILES[0],
  profiles: DEFAULT_PROFILES,
  completed: {},
  stars: {},
  lessonState: {},
  charAccuracy: {},
  activity: {},
  review: {},
  markCharComplete: () => {},
  setLessonState: () => {},
  recordAccuracy: () => {},
  recordActivity: () => {},
  markReviewed: () => {},
  switchProfile: () => {},
  addProfile: () => {},
  resetAll: () => {},
});

function profileKey(id: string) {
  return `${KEY_V3}.${id}`;
}

export function ProgressProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ProgressState>({
    data: EMPTY,
    profile: DEFAULT_PROFILES[0],
    profiles: DEFAULT_PROFILES,
    loaded: false,
  });

  // bootstrap: load profiles list + active profile data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      let profiles = DEFAULT_PROFILES;
      const rawProfiles = await AsyncStorage.getItem(PROFILES_KEY);
      if (rawProfiles) {
        try {
          const parsed = JSON.parse(rawProfiles);
          if (Array.isArray(parsed) && parsed.length) profiles = parsed;
        } catch {
          // keep default
        }
      }
      const activeId = (await AsyncStorage.getItem('strokeapp.activeProfile')) ?? profiles[0].id;
      const profile = profiles.find((p) => p.id === activeId) ?? profiles[0];

      // try v3 data for this profile
      let data = EMPTY;
      const rawV3 = await AsyncStorage.getItem(profileKey(profile.id));
      if (rawV3) {
        try {
          data = { ...EMPTY, ...JSON.parse(rawV3) };
        } catch {
          data = EMPTY;
        }
      } else {
        // migrate legacy single-user data into first profile
        const rawV2 = await AsyncStorage.getItem(KEY_V2);
        if (rawV2) {
          try {
            const parsed = JSON.parse(rawV2);
            data = { ...EMPTY, completed: parsed.completed ?? {}, stars: parsed.stars ?? {} };
          } catch {
            // corrupted
          }
        } else {
          const rawV1 = await AsyncStorage.getItem(KEY_V1);
          if (rawV1) {
            try {
              data = { ...EMPTY, completed: JSON.parse(rawV1) };
            } catch {
              // corrupted
            }
          }
        }
        if (data !== EMPTY) await AsyncStorage.setItem(profileKey(profile.id), JSON.stringify(data));
      }

      setState({ data, profile, profiles, loaded: true });
    })();
  }, []);

  const persist = useCallback((data: ProfileData, profile: Profile, profiles: Profile[]) => {
    setState({ data, profile, profiles, loaded: true });
    if (typeof window === 'undefined') return;
    AsyncStorage.setItem(profileKey(profile.id), JSON.stringify(data));
    AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    AsyncStorage.setItem('strokeapp.activeProfile', profile.id);
  }, []);

  // functional setState so chained updates (markCharComplete + recordAccuracy + ...)
  // in the same tick compose instead of clobbering each other via a stale closure
  const update = useCallback((fn: (d: ProfileData) => ProfileData) => {
    setState((prev) => {
      const data = fn(prev.data);
      if (typeof window !== 'undefined') {
        AsyncStorage.setItem(profileKey(prev.profile.id), JSON.stringify(data));
      }
      return { ...prev, data };
    });
  }, []);

  const markCharComplete = useCallback(
    (levelId: string, char: string, stars?: number) =>
      update((d) => {
        const prevChars = d.completed[levelId] ?? [];
        const completed = prevChars.includes(char)
          ? d.completed
          : { ...d.completed, [levelId]: [...prevChars, char] };
        const prevStars = d.stars[levelId] ?? {};
        const best = Math.max(prevStars[char] ?? 0, stars ?? prevStars[char] ?? 1);
        const starsMap = { ...d.stars, [levelId]: { ...prevStars, [char]: best } };
        return { ...d, completed, stars: starsMap };
      }),
    [update],
  );

  const setLessonState = useCallback(
    (levelId: string, lessonState: LessonState | null) =>
      update((d) => {
        const next = { ...d.lessonState };
        if (lessonState === null) delete next[levelId];
        else next[levelId] = lessonState;
        return { ...d, lessonState: next };
      }),
    [update],
  );

  const recordAccuracy = useCallback(
    (char: string, score: number) =>
      update((d) => {
        const prev = d.charAccuracy[char];
        // keep running min-avg toward the low end so weak chars surface
        const next = prev === undefined ? score : prev * 0.5 + score * 0.5;
        return { ...d, charAccuracy: { ...d.charAccuracy, [char]: next } };
      }),
    [update],
  );

  const recordActivity = useCallback(
    (char: string) =>
      update((d) => {
        const now = new Date();
        const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const activity = { ...d.activity, [day]: (d.activity[day] ?? 0) + 1 };
        return { ...d, activity };
      }),
    [update],
  );

  const markReviewed = useCallback(
    (char: string) =>
      update((d) => ({ ...d, review: { ...d.review, [char]: Date.now() } })),
    [update],
  );

  const switchProfile = useCallback(
    (id: string) => {
      const profile = state.profiles.find((p) => p.id === id);
      if (!profile) return;
      (async () => {
        const raw = await AsyncStorage.getItem(profileKey(id));
        let data = EMPTY;
        if (raw) {
          try {
            data = { ...EMPTY, ...JSON.parse(raw) };
          } catch {
            data = EMPTY;
          }
        }
        persist(data, profile, state.profiles);
      })();
    },
    [state.profiles, persist],
  );

  const addProfile = useCallback(
    (name: string) => {
      const id = `p${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const first = Array.from(name.trim())[0] ?? '我';
      const profile: Profile = { id, name: name.trim(), avatar: first };
      const profiles = [...state.profiles, profile];
      persist(EMPTY, profile, profiles);
    },
    [state.profiles, persist],
  );

  const resetAll = useCallback(
    () => persist({ ...EMPTY }, state.profile, state.profiles),
    [persist, state.profile, state.profiles],
  );

  const value = useMemo(
    () => ({
      loaded: state.loaded,
      profile: state.profile,
      profiles: state.profiles,
      completed: state.data.completed,
      stars: state.data.stars,
      lessonState: state.data.lessonState,
      charAccuracy: state.data.charAccuracy,
      activity: state.data.activity,
      review: state.data.review,
      markCharComplete,
      setLessonState,
      recordAccuracy,
      recordActivity,
      markReviewed,
      switchProfile,
      addProfile,
      resetAll,
    }),
    [
      state,
      markCharComplete,
      setLessonState,
      recordAccuracy,
      recordActivity,
      markReviewed,
      switchProfile,
      addProfile,
      resetAll,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
