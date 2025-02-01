import React, { useEffect } from 'react';

import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  StyleSheet,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { TimerList } from './components/timer/timer-list';
import { useTimerLogic } from './hooks/useTimerLogic';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  // 타이머 로직 훅 사용
  useTimerLogic();

  useEffect(() => {
    // 알림 권한 요청
    (async () => {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('알림 권한이 거부되었습니다.');
        }
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <TimerList />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
