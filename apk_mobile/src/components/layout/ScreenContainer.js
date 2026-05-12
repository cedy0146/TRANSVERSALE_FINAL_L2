import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_PADDING = 16;
const BOTTOM_TAB_GAP = 120; // anti-recouvrement bottom-tab

export default function ScreenContainer({
  children,
  style,
  contentStyle,
  refreshControl,
  header,
  safeTopExtra = 0,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.safeRoot, { paddingTop: insets.top + safeTopExtra }]}
    >
      <View style={[styles.flex, style]}>
        {header}
        <ScrollView
          refreshControl={refreshControl}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: DEFAULT_PADDING,
              paddingBottom: Math.max(0, insets.bottom) + BOTTOM_TAB_GAP,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeRoot: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  content: { gap: 0 },
});
