import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTimerStore } from '../../store/timerStore';
import { Timer } from '../../types/timer';

interface TimerItemProps {
  timer: Timer;
}

export function TimerItem({ timer }: TimerItemProps) {
  const { startTimer, pauseTimer, stopTimer, removeTimer } = useTimerStore();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formatTime(timer.remainingTime)}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {!timer.isRunning && !timer.isPaused && (
          <TouchableOpacity
            onPress={() => startTimer(timer.id)}
            style={styles.playButton}
          >
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        )}
        
        {timer.isRunning && (
          <TouchableOpacity
            onPress={() => pauseTimer(timer.id)}
            style={styles.pauseButton}
          >
            <Text style={styles.buttonText}>⏸</Text>
          </TouchableOpacity>
        )}
        
        {timer.isPaused && (
          <TouchableOpacity
            onPress={() => startTimer(timer.id)}
            style={styles.playButton}
          >
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => stopTimer(timer.id)}
          style={styles.stopButton}
        >
          <Text style={styles.buttonText}>⏹</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => removeTimer(timer.id)}
          style={styles.removeButton}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    backgroundColor: '#22C55E',
    padding: 8,
    borderRadius: 20,
  },
  pauseButton: {
    backgroundColor: '#EAB308',
    padding: 8,
    borderRadius: 20,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 20,
  },
  removeButton: {
    backgroundColor: '#6B7280',
    padding: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
  },
}); 