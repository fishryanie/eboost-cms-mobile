import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';

import { AnimatedTabBar } from 'components/animated-tab-bar';
import { TabIcon, type TabIconName } from 'components/tab-icon';

const tabs: { icon: TabIconName; label: string; name: string }[] = [
  { icon: 'technical', label: 'Technical', name: 'technical' },
  { icon: 'operation', label: 'Operation', name: 'operation' },
  { icon: 'marketing', label: 'Marketing', name: 'marketing' },
];

export default function AppTabs() {
  return (
    <Tabs
      detachInactiveScreens={Platform.OS !== 'ios'}
      initialRouteName='technical'
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 0,
        },
      }}
      tabBar={(props): ReactElement => <AnimatedTabBar {...props} />}>
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
