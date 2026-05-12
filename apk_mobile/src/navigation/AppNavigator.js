import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { t } from '../i18n/strings';

import DashboardScreen   from '../screens/DashboardScreen';
import BatteriesScreen   from '../screens/BatteriesScreen';
import FoyersScreen      from '../screens/FoyersScreen';
import DemandesScreen    from '../screens/DemandesScreen';
import AllocationScreen  from '../screens/AllocationScreen';
import RapportsScreen    from '../screens/RapportsScreen';
import UtilisateursScreen from '../screens/UtilisateursScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name:'Dashboard',    Comp:DashboardScreen,    icon:'home',          iconFoc:'home' },
  { name:'Batteries',    Comp:BatteriesScreen,    icon:'battery-charging-outline', iconFoc:'battery-charging' },
  { name:'Foyers',       Comp:FoyersScreen,       icon:'home-outline',  iconFoc:'home' },
  { name:'Demandes',     Comp:DemandesScreen,     icon:'flash-outline', iconFoc:'flash' },
  { name:'Allocation',   Comp:AllocationScreen,   icon:'construct-outline', iconFoc:'construct' },
  { name:'Rapports',     Comp:RapportsScreen,     icon:'document-text-outline', iconFoc:'document-text' },
  { name:'Utilisateurs', Comp:UtilisateursScreen, icon:'people-outline', iconFoc:'people' },
];

export default function AppNavigator() {
  const { theme, lang } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.tabActive,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarIcon: ({ focused, color, size }) => {
          const tab = TABS.find(t => t.name === route.name);
          const iconName = focused ? (tab?.iconFoc||tab?.icon||'ellipse') : (tab?.icon||'ellipse-outline');
          return <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />;
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.Comp} />
      ))}
    </Tab.Navigator>
  );
}
