export interface Timer {
  id: string;
  duration: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  order: number;
}

export interface TimerStore {
  timers: Timer[];
  activeTimerId: string | null;
  addTimer: (duration: number) => void;
  removeTimer: (id: string) => void;
  updateTimer: (id: string, updates: Partial<Timer>) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  moveTimer: (id: string, newOrder: number) => void;
} 