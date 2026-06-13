import { SymbolView, type SymbolViewProps } from 'expo-symbols';

export type TabIconName =
  | 'advertisement'
  | 'balance'
  | 'content'
  | 'gift'
  | 'home'
  | 'location'
  | 'map'
  | 'marketing'
  | 'notification'
  | 'operation'
  | 'promotion'
  | 'reservation'
  | 'subscription'
  | 'tariff'
  | 'technical'
  | 'transfer'
  | 'users'
  | 'vehicle';

const symbolMap: Record<TabIconName, SymbolViewProps['name']> = {
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
};

export function TabIcon({ color, name, size = 22 }: { color: string; name: TabIconName; size?: number }) {
  return <SymbolView name={symbolMap[name]} resizeMode='scaleAspectFit' size={size} tintColor={color} />;
}
