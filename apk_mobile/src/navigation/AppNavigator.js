import React from 'react';
import {
  useWindowDimensions,
  Text,
  View,
} from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import BatteriesScreen from '../screens/BatteriesScreen';
import DemandesScreen from '../screens/DemandesScreen';
import RapportsScreen from '../screens/RapportsScreen';

const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────
// Seulement 4 menus importants
// ─────────────────────────────────────────────
const TABS = [
  {
    name: 'Dashboard',
    Comp: DashboardScreen,
    emoji: '📊',
    label: 'Accueil',
  },

  {
    name: 'Batteries',
    Comp: BatteriesScreen,
    emoji: '🔋',
    label: 'Batteries',
  },

  {
    name: 'Demandes',
    Comp: DemandesScreen,
    emoji: '⚡',
    label: 'Demandes',
  },

  {
    name: 'Rapports',
    Comp: RapportsScreen,
    emoji: '📈',
    label: 'Rapports',
  },
];

// ─────────────────────────────────────────────
// Navigator
// ─────────────────────────────────────────────
export default function AppNavigator() {
  const { theme } = useApp();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabHeight = 68 + insets.bottom;

  const iconSize = width < 380 ? 20 : 24;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // ─────────────────────────────
        // Style barre menu
        // ─────────────────────────────
        tabBarStyle: {
          backgroundColor: theme.tabBar,

          borderTopWidth: 0,

          height: tabHeight,

          paddingBottom:
            insets.bottom > 0 ? insets.bottom : 8,

          paddingTop: 6,

          elevation: 10,

          shadowColor: theme.shadow,

          shadowOffset: {
            width: 0,
            height: -3,
          },

          shadowOpacity: 0.15,
          shadowRadius: 8,

          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },

        // ─────────────────────────────
        // Emoji + Texte
        // ─────────────────────────────
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find(
            t => t.name === route.name
          );

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Emoji */}
              <Text
                style={{
                  fontSize: focused
                    ? iconSize + 4
                    : iconSize,

                  opacity: focused ? 1 : 0.7,
                }}
              >
                {tab?.emoji}
              </Text>

         
            </View>
          );
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.Comp}
        />
      ))}
    </Tab.Navigator>
  );
}