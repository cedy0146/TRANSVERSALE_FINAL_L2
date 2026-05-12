import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';

export default function AppHeader({ title }) {
  const { theme, isDark, toggleTheme, lang, toggleLang } = useApp();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmall  = width < 380;
  const logoSize = isSmall ? 30 : 36;
  const iconSize = isSmall ? 16 : 18;
  const btnSize  = isSmall ? 30 : 36;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgSecondary}
      />
      <View style={[
        styles.header,
        {
          backgroundColor: theme.bgSecondary,
          borderBottomColor: theme.border,
          paddingTop: Math.max(insets.top, 8),
          paddingHorizontal: isSmall ? 12 : 16,
          paddingBottom: 10,
        }
      ]}>
        <View style={styles.left}>
          <View style={[
            styles.logo,
            { backgroundColor: theme.accentGreen, width: logoSize, height: logoSize, borderRadius: logoSize / 4 }
          ]}>
            <MaterialCommunityIcons name="lightning-bolt" size={logoSize * 0.5} color="#061810" />
          </View>
          <View>
            <Text style={[styles.appName, { color: theme.accentGreen, fontSize: isSmall ? 9 : 10 }]}>
              ELECTRIMADA
            </Text>
            <Text style={[styles.pageTitle, { color: theme.textPrimary, fontSize: isSmall ? 13 : 15 }]}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={toggleLang}
            style={[styles.badge, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
          >
            <Text style={[styles.badgeText, { color: theme.accentTeal, fontSize: isSmall ? 10 : 11 }]}>
              {lang.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.iconBtn,
              { backgroundColor: theme.bgCard, borderColor: theme.border, width: btnSize, height: btnSize, borderRadius: btnSize / 4 }
            ]}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
              size={iconSize}
              color={isDark ? theme.accentYellow : theme.accentPurple}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { alignItems: 'center', justifyContent: 'center' },
  appName: { fontWeight: '800', letterSpacing: 2 },
  pageTitle: { fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  badgeText: { fontWeight: '800', letterSpacing: 1 },
  iconBtn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
