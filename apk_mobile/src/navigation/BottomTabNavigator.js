import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { get } from '../i18n/strings';

// Importez vos écrans ici
import DashboardScreen from '../screens/DashboardScreen';
// import BatteriesScreen from '../screens/BatteriesScreen';
// import DemandesScreen from '../screens/DemandesScreen';
// import AllocationScreen from '../screens/AllocationScreen';
// import RapportsScreen from '../screens/RapportsScreen';

const Tab = createBottomTabNavigator();

/**
 * @file BottomTabNavigator.js
 * @description Configure la navigation par onglets de l'application.
 *              Applique la charte graphique pour les onglets, les icônes et les labels bilingues.
 */
const BottomTabNavigator = () => {
  const tabsConfig = [
    { name: 'Dashboard', component: DashboardScreen, icon: 'home', labelKey: 'home' },
    { name: 'Batteries', component: DashboardScreen, icon: 'battery-charging', labelKey: 'battery' }, // Placeholder
    { name: 'Demandes', component: DashboardScreen, icon: 'list-box', labelKey: 'demands' }, // Placeholder
    { name: 'Allocation', component: DashboardScreen, icon: 'lightning-bolt', labelKey: 'allocation' }, // Placeholder
    { name: 'Rapports', component: DashboardScreen, icon: 'chart-bar', labelKey: 'reports' }, // Placeholder
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Les écrans gèrent leur propre header (AppHeader)
        tabBarStyle: {
          // Homogénéité : Fond blanc, bordure supérieure et espacement définis par le thème
          backgroundColor: THEME.colors.surface,
          borderTopColor: THEME.colors.border,
          borderTopWidth: 1,
          height: THEME.touchTarget + THEME.spacing.sm, // Hauteur pour assurer le touch target
          paddingBottom: THEME.spacing.xs, // Petit padding pour le bas
          paddingTop: THEME.spacing.xs,
        },
        tabBarLabelStyle: {
          // Homogénéité : Taille de police définie par le thème
          ...THEME.typography.caption,
          fontSize: 10, // Taille de police spécifique pour les labels d'onglets
        },
        tabBarActiveTintColor: THEME.colors.primary, // Couleur active définie par le thème
        tabBarInactiveTintColor: THEME.colors.textSecondary, // Couleur inactive définie par le thème
      }}
    >
      {tabsConfig.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            // Signifiance : Icônes explicites et labels bilingues - Nielsen #2
            tabBarLabel: `${get(tab.labelKey)} / ${get(tab.labelKey, 'mg')}`, // Exemple de label bilingue
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name={tab.icon} color={color} size={24} /> // Icônes de 24px
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

/*
Liste des violations ergonomiques corrigées :

Avant :
- Labels d'onglets non bilingues ou peu clairs.
- Icônes génériques ou absentes.
- Style de la barre d'onglets non cohérent avec le reste de l'application.

Après :
- **Signifiance (Nielsen #2)** : Labels bilingues clairs et icônes explicites pour chaque onglet.
- **Homogénéité (Nielsen #4)** : Style de la barre d'onglets (fond, bordure, couleurs active/inactive) défini par le `THEME`.
- **Flexibilité/Accessibilité** : Hauteur de la barre d'onglets ajustée pour assurer un touch target suffisant.
*/