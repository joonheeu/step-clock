import {
  useEffect,
  useRef,
} from 'react';

import * as Notifications from 'expo-notifications';

import { useTimerStore } from '../store/timerStore';

export function useTimerLogic() {
  const { timers, activeTimerId, updateTimer, startTimer } = useTimerStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeTimerId) return;

    const activeTimer = timers.find((t) => t.id === activeTimerId);
    if (!activeTimer || !activeTimer.isRunning) return;

    timerRef.current = setInterval(() => {
      updateTimer(activeTimerId, {
        remainingTime: activeTimer.remainingTime - 1,
      });

      if (activeTimer.remainingTime <= 1) {
        // 타이머 종료
        clearInterval(timerRef.current!);
        updateTimer(activeTimerId, {
          isRunning: false,
          remainingTime: 0,
        });

        // 알림 표시
        Notifications.scheduleNotificationAsync({
          content: {
            title: '타이머 완료',
            body: '타이머가 완료되었습니다.',
            sound: true,
          },
          trigger: null,
        });

        // 다음 타이머 시작
        const currentIndex = timers.findIndex((t) => t.id === activeTimerId);
        const nextTimer = timers[currentIndex + 1];
        if (nextTimer) {
          startTimer(nextTimer.id);
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTimerId, timers]);

  return null;
} 