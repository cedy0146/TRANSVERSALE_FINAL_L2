import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

import DashboardScreen    from '../screens/DashboardScreen';
import BatteriesScreen    from '../screens/BatteriesScreen';
import FoyersScreen       from '../screens/FoyersScreen';
import DemandesScreen     from '../screens/DemandesScreen';
import AllocationScreen   from '../screens/AllocationScreen';
import RapportsScreen     from '../screens/RapportsScreen';
import UtilisateursScreen from '../screens/UtilisateursScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Dashboard',    Comp: DashboardScreen,    icon: 'view-dashboard-outline', iconFoc: 'view-dashboard' },
  { name: 'Batteries',    Comp: BatteriesScreen,    icon: 'battery-charging-outline', iconFoc: 'battery-charging' },
  { name: 'Foyers',       Comp: FoyersScreen,       icon: 'home-group',             iconFoc: 'home-group' },
  { name: 'Demandes',     Comp: DemandesScreen,     icon: 'lightning-bolt-outline', iconFoc: 'lightning-bolt' },
  { name: 'Allocation',   Comp: AllocationScreen,   icon: 'brain',                  iconFoc: 'brain' },
  { name: 'Rapports',     Comp: RapportsScreen,     icon: 'file-chart-outline',     iconFoc: 'file-chart' },
  { name: 'Utilisateurs', Comp: UtilisateursScreen, icon: 'account-group-outline',  iconFoc: 'account-group' },
];

export default function AppNavigator() {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabHeight = 52 + insets.bottom;
  const iconSize  = width < 380 ? 21 : 24;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find(t => t.name === route.name);
          const iconName = focused ? tab?.iconFoc : tab?.icon;
          return (
            <MaterialCommunityIcons
              name={iconName || 'circle-outline'}
              size={focused ? iconSize + 2 : iconSize}
              color={color}
            />
          );
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.Comp} />
      ))}
    </Tab.Navigator>
  );
}
