import { SymbolView, type SymbolViewProps } from 'expo-symbols';

export type TabIconName =
  | 'alerts'
  | 'appearance'
  | 'balance'
  | 'bookmarks'
  | 'downloads'
  | 'email'
  | 'filter'
  | 'help'
  | 'history'
  | 'home'
  | 'library'
  | 'location'
  | 'map'
  | 'messages'
  | 'note'
  | 'password'
  | 'personal'
  | 'play'
  | 'profile'
  | 'screenshot'
  | 'search'
  | 'sleep'
  | 'tier'
  | 'transfer'
  | 'trending'
  | 'users'
  | 'voice';

const symbolMap: Record<TabIconName, SymbolViewProps['name']> = {
  alerts: 'exclamationmark.bubble.fill',
  appearance: 'moon.fill',
  balance: 'creditcard.fill',
  bookmarks: 'bookmark',
  downloads: 'arrow.down.circle',
  email: 'envelope.fill',
  filter: 'line.3.horizontal.decrease',
  help: 'questionmark.circle.fill',
  history: 'clock.arrow.circlepath',
  home: 'house.fill',
  library: 'books.vertical',
  location: 'mappin.and.ellipse',
  map: 'map.fill',
  messages: 'message.fill',
  note: 'square.and.pencil',
  password: 'key.fill',
  personal: 'person.crop.circle.fill',
  play: 'play.fill',
  profile: 'person.crop.circle.fill',
  screenshot: 'camera.fill',
  search: 'magnifyingglass',
  sleep: 'moon.zzz',
  tier: 'star.fill',
  transfer: 'arrow.left.arrow.right',
  trending: 'flame.fill',
  users: 'person.2.fill',
  voice: 'mic.fill',
};

export function TabIcon({ color, name, size = 22 }: { color: string; name: TabIconName; size?: number }) {
  return <SymbolView name={symbolMap[name]} resizeMode='scaleAspectFit' size={size} tintColor={color} />;
}
