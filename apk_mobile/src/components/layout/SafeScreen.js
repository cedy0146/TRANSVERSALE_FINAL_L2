import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SafeScreen({ children, style, edges = ['top', 'bottom'] }) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop:    edges.includes('top')    ? insets.top    : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft:   edges.includes('left')   ? insets.left   : 0,
    paddingRight:  edges.includes('right')  ? insets.right  : 0,
  };

  return (
    <View style={[styles.safe, paddingStyle, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
