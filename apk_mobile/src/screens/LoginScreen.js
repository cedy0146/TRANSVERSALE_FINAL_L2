import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { safePost } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../components/ui/AppHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../i18n/strings';

export default function LoginScreen() {
  const { theme, lang, setUser } = useApp();
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t(lang, 'error'), t(lang, 'login_empty_fields'));
      return;
    }

    setLoading(true);
    const response = await safePost('/auth/login', { username, password }); // Assurez-vous que cette route existe
    setLoading(false);

    if (response.ok) {
      const { token, user } = response.data;
      
      // Sauvegarder le token et les infos utilisateur localement
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Mettre à jour le contexte global de l'application
      setUser(user);

      Alert.alert(t(lang, 'success'), t(lang, 'login_success'));

      // Redirection basée sur le rôle
      if (user.role === 'ADMIN' || user.role === 'RESPONSABLE') {
        navigation.replace('AdminDashboard'); // Assurez-vous que 'AdminDashboard' est défini dans votre navigateur
      } else {
        navigation.replace('UserDashboard'); // Assurez-vous que 'UserDashboard' est défini
      }
    } else {
      Alert.alert(t(lang, 'error'), response.error || t(lang, 'login_failed'));
    }
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bgPrimary }]}>
      <AppHeader title={t(lang, 'login_title')} />
      <View style={s.content}>
        <Text style={[s.label, { color: theme.textSecondary }]}>{t(lang, 'username')}</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
          placeholder={t(lang, 'username_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={[s.label, { color: theme.textSecondary, marginTop: 15 }]}>{t(lang, 'password')}</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.bgInput, color: theme.textPrimary, borderColor: theme.border }]}
          placeholder={t(lang, 'password_placeholder')}
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton
          title={loading ? t(lang, 'logging_in') : t(lang, 'login_button')}
          onPress={handleLogin}
          loading={loading}
          style={s.loginButton}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  loginButton: {
    marginTop: 30,
    height: 55,
  },
});