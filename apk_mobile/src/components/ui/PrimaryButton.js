import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function PrimaryButton({ title, onPress, disabled, loading, variant='primary', style }) {
  const { theme } = useApp();
  const bg = variant==='danger' ? theme.accentRed : variant==='secondary' ? theme.bgCard : theme.accentGreen;
  const tc = variant==='secondary' ? theme.accentGreen : '#0a1618';
  const bc = variant==='secondary' ? theme.accentGreen : 'transparent';
  return (
    <Pressable
      onPress={onPress} disabled={disabled||loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderColor: bc, opacity: (disabled||loading) ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={tc} size="small" /> :
        <Text style={[styles.txt, { color: tc }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  txt: { fontWeight: '800', fontSize: 15 },
});
