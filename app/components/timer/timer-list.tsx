import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTimerStore } from '../../store/timerStore';
import { TimerItem } from './timer-item';

export function TimerList() {
  const { timers, addTimer } = useTimerStore();

  const handleAddTimer = () => {
    // 기본값으로 25분(1500초) 타이머 추가
    addTimer(1500);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {timers
          .sort((a, b) => a.order - b.order)
          .map((timer) => (
            <TimerItem key={timer.id} timer={timer} />
          ))}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddTimer}
      >
        <Text style={styles.addButtonText}>+ 새 타이머 추가</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 