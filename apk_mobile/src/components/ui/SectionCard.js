import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function SectionCard({ title, children, style }) {
  const { theme } = useApp();
  return (
    <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }, style]}>
      {title ? <Text style={[styles.title, { color: theme.accentGreen }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: 0.3 },
});
