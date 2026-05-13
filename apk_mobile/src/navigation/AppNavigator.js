import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

// Import des écrans
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen'; // Utilisé comme AdminDashboard
import DemandesScreen from '../screens/DemandesScreen';   // Utilisé comme UserDashboard
import AllocationScreen from '../screens/AllocationScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, theme } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bgPrimary }
        }}
      >
        {/* Écran de base accessible à tous */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Route "AdminDashboard" : Redirige vers l'écran principal de gestion */}
        <Stack.Screen name="AdminDashboard" component={DashboardScreen} />

        {/* Route "UserDashboard" : Redirige vers l'écran simplifié (ex: Demandes) */}
        <Stack.Screen name="UserDashboard" component={DemandesScreen} />

        {/* Autres routes partagées ou spécifiques */}
        <Stack.Screen name="Allocation" component={AllocationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}