import { create } from 'zustand';

import {
  Timer,
  TimerStore,
} from '../types/timer';

export const useTimerStore = create<TimerStore>((set, get) => ({
  timers: [],
  activeTimerId: null,

  addTimer: (duration: number) => {
    set((state) => {
      const newTimer: Timer = {
        id: Date.now().toString(),
        duration,
        isRunning: false,
        isPaused: false,
        remainingTime: duration,
        order: state.timers.length,
      };
      return { timers: [...state.timers, newTimer] };
    });
  },

  removeTimer: (id: string) => {
    set((state) => ({
      timers: state.timers.filter((timer) => timer.id !== id),
    }));
  },

  updateTimer: (id: string, updates: Partial<Timer>) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id ? { ...timer, ...updates } : timer
      ),
    }));
  },

  startTimer: (id: string) => {
    const { timers } = get();
    const timer = timers.find((t) => t.id === id);
    if (!timer) return;

    set((state) => ({
      activeTimerId: id,
      timers: state.timers.map((t) =>
        t.id === id ? { ...t, isRunning: true, isPaused: false } : t
      ),
    }));
  },

  pauseTimer: (id: string) => {
    set((state) => ({
      timers: state.timers.map((t) =>
        t.id === id ? { ...t, isRunning: false, isPaused: true } : t
      ),
    }));
  },

  stopTimer: (id: string) => {
    const { timers } = get();
    const currentTimer = timers.find((t) => t.id === id);
    if (!currentTimer) return;

    set((state) => ({
      activeTimerId: null,
      timers: state.timers.map((t) =>
        t.id === id
          ? { ...t, isRunning: false, isPaused: false, remainingTime: t.duration }
          : t
      ),
    }));
  },

  moveTimer: (id: string, newOrder: number) => {
    set((state) => {
      const timers = [...state.timers];
      const oldIndex = timers.findIndex((t) => t.id === id);
      if (oldIndex === -1) return state;

      const [timer] = timers.splice(oldIndex, 1);
      timers.splice(newOrder, 0, timer);

      return {
        timers: timers.map((t, index) => ({ ...t, order: index })),
      };
    });
  },
})); 