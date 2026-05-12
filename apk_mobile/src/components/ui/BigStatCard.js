import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function BigStatCard({ label, value, icon, variant='green' }) {
  const { theme } = useApp();
  const accent = {
    green: theme.accentGreen, teal: theme.accentTeal,
    yellow: theme.accentYellow, red: theme.accentRed,
    purple: theme.accentPurple,
  }[variant] || theme.accentGreen;

  return (
    <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <View style={[styles.iconBox, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon||'flash'} size={20} color={accent} />
      </View>
      <Text style={[styles.value, { color: theme.textPrimary }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={2}>{label}</Text>
      <View style={[styles.bar, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex:1, padding:14, borderRadius:16, borderWidth:1, minWidth:140, overflow:'hidden' },
  iconBox: { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center', marginBottom:8 },
  value: { fontSize:22, fontWeight:'900', marginBottom:3 },
  label: { fontSize:12, fontWeight:'600', lineHeight:16 },
  bar: { position:'absolute', bottom:0, left:0, right:0, height:3, borderBottomLeftRadius:16, borderBottomRightRadius:16 },
});
