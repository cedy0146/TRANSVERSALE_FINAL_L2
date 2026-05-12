import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useApp } from '../../context/AppContext';
 
export default function SectionCard({ title, children, style }) {
  const { theme } = useApp();
  const { width } = useWindowDimensions();
  const pad = width < 380 ? 12 : 16;
 
  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.bgCard, borderColor: theme.border, padding: pad, marginBottom: pad * 0.75 },
      style
    ]}>
      {title ? (
        <Text style={[styles.title, { color: theme.accentGreen, marginBottom: pad * 0.75 }]}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
 
const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
 