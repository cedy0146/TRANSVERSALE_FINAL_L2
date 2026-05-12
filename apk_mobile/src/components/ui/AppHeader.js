import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function AppHeader({ title }) {
  const { theme, isDark, toggleTheme, lang, toggleLang } = useApp();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bgSecondary} />
      <View style={[styles.header, { backgroundColor: theme.bgSecondary, borderBottomColor: theme.border }]}>
        {/* Logo + Titre */}
        <View style={styles.left}>
          <View style={[styles.logo, { backgroundColor: theme.accentGreen }]}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
          <View>
            <Text style={[styles.appName, { color: theme.accentGreen }]}>ELECTRIMADA</Text>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{title}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Toggle langue */}
          <TouchableOpacity onPress={toggleLang} style={[styles.badge, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.badgeText, { color: theme.accentTeal }]}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Toggle thème */}
          <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={isDark ? theme.accentYellow : theme.accentPurple} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16 },
  appName: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  pageTitle: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
