import { Pressable, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useApp } from '../../context/AppContext';
 
export default function PrimaryButton({ title, onPress, disabled, loading, variant = 'primary', style }) {
  const { theme } = useApp();
  const { width } = useWindowDimensions();
 
  const bg = variant === 'danger'     ? theme.accentRed
           : variant === 'secondary'  ? theme.bgCard
           : theme.accentGreen;
  const tc = variant === 'secondary'  ? theme.accentGreen : '#0a1618';
  const bc = variant === 'secondary'  ? theme.accentGreen : 'transparent';
 
  const padV  = width < 380 ? 11 : 13;
  const fsize = width < 380 ? 14 : 15;
 
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: bc, paddingVertical: padV, opacity: (disabled || loading) ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={tc} size="small" />
        : <Text style={[styles.txt, { color: tc, fontSize: fsize }]}>{title}</Text>
      }
    </Pressable>
  );
}
 
const styles = StyleSheet.create({
  btn: { paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  txt: { fontWeight: '800' },
});