import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function FormModal({ visible, title, onClose, onSave, children, saveLabel = 'Enregistrer', loading }) {
  const { theme } = useApp();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bgHover }]}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Body */}
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.btnCancel, { borderColor: theme.border }]}>
              <Text style={[styles.btnCancelTxt, { color: theme.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} disabled={loading}
              style={[styles.btnSave, { backgroundColor: theme.accentGreen, opacity: loading ? 0.6 : 1 }]}>
              <Text style={styles.btnSaveTxt}>{loading ? '...' : saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FieldInput({ label, value, onChangeText, placeholder, keyboardType, multiline, theme }) {
  return (
    <View style={fi.wrap}>
      <Text style={[fi.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={theme.textMuted} keyboardType={keyboardType || 'default'}
        multiline={multiline}
        style={[fi.input, { backgroundColor: theme.bgInput, borderColor: theme.border, color: theme.textPrimary }]}
      />
    </View>
  );
}

const fi = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 44 },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1 },
  btnCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnCancelTxt: { fontWeight: '700' },
  btnSave: { flex: 2, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  btnSaveTxt: { color: '#061810', fontWeight: '800', fontSize: 15 },
});
