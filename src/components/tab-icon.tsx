import { SymbolView, type SymbolViewProps } from 'expo-symbols';

export type TabIconName = 'balance' | 'history' | 'home' | 'location' | 'map' | 'transfer' | 'users';

const symbolMap: Record<TabIconName, SymbolViewProps['name']> = {
  balance: 'creditcard.fill',
  history: 'clock.arrow.circlepath',
  home: 'house.fill',
  location: 'mappin.and.ellipse',
  map: 'map.fill',
  transfer: 'arrow.left.arrow.right',
  users: 'person.2.fill',
};

export function TabIcon({ color, name, size = 22 }: { color: string; name: TabIconName; size?: number }) {
  return <SymbolView name={symbolMap[name]} resizeMode='scaleAspectFit' size={size} tintColor={color} />;
}
