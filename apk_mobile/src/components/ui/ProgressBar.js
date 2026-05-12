import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function ProgressBar({ value, max, height = 8 }) {
  const { theme } = useApp();
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const color = pct < 20 ? theme.accentRed : pct < 50 ? theme.accentYellow : theme.accentGreen;

  return (
    <View style={[styles.track, { backgroundColor: theme.border, height }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 99, overflow: 'hidden', width: '100%' },
  fill:  { borderRadius: 99 },
});
