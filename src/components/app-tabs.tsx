import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';

import { AnimatedTabBar } from 'components/animated-tab-bar';
import { TabIcon, type TabIconName } from 'components/tab-icon';

const tabs: { icon: TabIconName; label: string; name: string }[] = [
  { icon: 'home', label: 'Home', name: 'home' },
  { icon: 'history', label: 'History', name: 'history' },
  { icon: 'location', label: 'Location', name: 'location' },
  { icon: 'technical', label: 'Technical', name: 'technical' },
  { icon: 'users', label: 'Users', name: 'users' },
];

export default function AppTabs() {
  return (
    <Tabs
      detachInactiveScreens={Platform.OS !== 'ios'}
      initialRouteName='home'
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
          position: 'absolute',
        },
      }}
      tabBar={(props): ReactElement => <AnimatedTabBar {...props} popupDisabledRouteNames={['home', 'history']} />}>
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ color, size }) => <TabIcon color={String(color)} name={tab.icon} size={size} />,
            tabBarLabel: tab.label,
          }}
        />
      ))}
    </Tabs>
  );
}
