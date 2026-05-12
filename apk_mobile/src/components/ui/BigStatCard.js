import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
 
const MCI_ICONS = {
  // Dashboard KPIs
  'battery-charging': 'battery-charging',
  'home':             'home-group',
  'flash':            'lightning-bolt',
  'document-text':    'file-chart',
  // Batteries screen
  'battery':          'car-battery',
  // Fallback
};
 
export default function BigStatCard({ label, value, icon, variant = 'green' }) {
  const { theme } = useApp();
  const { width } = useWindowDimensions();
 
  const accent = {
    green:  theme.accentGreen,
    teal:   theme.accentTeal,
    yellow: theme.accentYellow,
    red:    theme.accentRed,
    purple: theme.accentPurple,
  }[variant] || theme.accentGreen;
 
  // Taille adaptative : petits écrans → plus compact
  const isSmall = width < 380;
  const cardPad  = isSmall ? 11 : 14;
  const iconSize = isSmall ? 18 : 22;
  const iconBox  = isSmall ? 32 : 38;
  const valSize  = isSmall ? 19 : 24;
  const lblSize  = isSmall ? 10 : 12;
 
  const mciIcon = MCI_ICONS[icon] || 'lightning-bolt-circle';
 
  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.bgCard, borderColor: theme.border, padding: cardPad }
    ]}>
      <View style={[
        styles.iconBox,
        { backgroundColor: accent + '22', width: iconBox, height: iconBox, borderRadius: iconBox / 2.5 }
      ]}>
        <MaterialCommunityIcons name={mciIcon} size={iconSize} color={accent} />
      </View>
      <Text style={[styles.value, { color: theme.textPrimary, fontSize: valSize }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.textSecondary, fontSize: lblSize }]} numberOfLines={2}>
        {label}
      </Text>
      <View style={[styles.bar, { backgroundColor: accent }]} />
    </View>
  );
}
 
const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: '900',
    marginBottom: 3,
  },
  label: {
    fontWeight: '600',
    lineHeight: 16,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});


