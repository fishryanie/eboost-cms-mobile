import { TabIcon } from 'components/tab-icon';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { AnimatedTabBar } from './tab-bar';
import { tabs } from './constants';

export function AppTabs() {
  return (
    <Tabs
      detachInactiveScreens={Platform.OS !== 'ios'}
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0, height: 0, position: 'absolute' },
      }}
      tabBar={props => <AnimatedTabBar {...props} />}>
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
