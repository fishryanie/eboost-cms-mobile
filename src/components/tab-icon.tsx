import { SymbolView, type SymbolViewProps } from 'expo-symbols';

const symbolMap = {
  advertisement: 'megaphone.fill',
  balance: 'creditcard.fill',
  content: 'doc.text.fill',
  gift: 'gift.fill',
  home: 'house.fill',
  location: 'mappin.and.ellipse',
  map: 'map.fill',
  marketing: 'megaphone.fill',
  notification: 'bell.fill',
  operation: 'gearshape.2.fill',
  promotion: 'ticket.fill',
  reservation: 'calendar.badge.clock',
  subscription: 'rectangle.stack.badge.person.crop.fill',
  tariff: 'dollarsign.circle.fill',
  technical: 'wrench.and.screwdriver.fill',
  transfer: 'arrow.left.arrow.right',
  users: 'person.2.fill',
  vehicle: 'scooter',
} satisfies Record<string, SymbolViewProps['name']>;

export type TabIconName = keyof typeof symbolMap;

export function TabIcon({ color, name, size = 22 }: { color: string; name: TabIconName; size?: number }) {
  return <SymbolView name={symbolMap[name]} resizeMode='scaleAspectFit' size={size} tintColor={color} />;
}
