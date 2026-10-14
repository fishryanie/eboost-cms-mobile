import {
  ArrowLeftRight,
  Bell,
  Bike,
  Bug,
  CalendarClock,
  CircleDollarSign,
  CircleGauge,
  CreditCard,
  EvCharger,
  FileText,
  Gift,
  Home,
  Map,
  MapPin,
  Megaphone,
  Settings2,
  Ticket,
  UserSquare,
  Users,
  Wrench,
  ClipboardClock,
  Scale,
  LucideIcon,
} from 'lucide-react-native';

const symbolMap: Record<string, LucideIcon> = {
  advertisement: Megaphone,
  balance: CreditCard,
  bug: Bug,
  content: FileText,
  gift: Gift,
  home: Home,
  location: MapPin,
  map: Map,
  marketing: Megaphone,
  notification: Bell,
  operation: Settings2,
  promotion: Ticket,
  reservation: CalendarClock,
  subscription: UserSquare,
  tariff: CircleDollarSign,
  technical: Wrench,
  transfer: ArrowLeftRight,
  users: Users,
  vehicle: Bike,
  evCharger: EvCharger,
  circleGauge: CircleGauge,
  clipboardClock: ClipboardClock,
  scale: Scale,
};

export type TabIconName = keyof typeof symbolMap;

export function TabIcon({ color, name, size = 22 }: { color: string; name: TabIconName; size?: number }) {
  const IconComponent = symbolMap[name];
  if (!IconComponent) return null;
  return <IconComponent color={color} size={size} />;
}
