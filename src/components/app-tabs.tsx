import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';

import { AnimatedTabBar } from 'components/animated-tab-bar';
import { TabIcon, type TabIconName } from 'components/tab-icon';

const tabs: { icon: TabIconName; label: string; name: string }[] = [
  { icon: 'home', label: 'Home', name: 'home' },
  { icon: 'operation', label: 'Operation', name: 'operation' },
  { icon: 'marketing', label: 'Marketing', name: 'marketing' },
  { icon: 'technical', label: 'Technical', name: 'technical' },
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
      tabBar={(props): ReactElement => <AnimatedTabBar {...props} popupDisabledRouteNames={['home']} />}>
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
