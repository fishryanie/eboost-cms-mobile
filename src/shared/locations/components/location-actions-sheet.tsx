import { Alert } from 'react-native';
import { Eye, EyeOff, RefreshCcw, Undo2 } from 'lucide-react-native';

import { ActionSheet } from 'components/ui';

import { getLocationVisibilityAction } from '../location-actions';
import { useLocationActionMutations } from '../hooks';

export function LocationActionsSheet({ location, onClose, open }: { location?: LocationRecord; onClose: () => void; open: boolean }) {
  const mutations = useLocationActionMutations(location?.id);

  if (!location) {
    return <ActionSheet items={[]} onClose={onClose} open={open} title='Location actions' />;
  }

  const visibility = getLocationVisibilityAction(location);
  const busy = mutations.restore.isPending || mutations.sync.isPending || mutations.visibility.isPending;

  return (
    <ActionSheet
      onClose={onClose}
      open={open}
      title={location.name}
      items={[
        {
          disabled: busy,
          icon: RefreshCcw,
          key: 'sync',
          label: 'Sync partnership location',
          meta: 'Refresh partner location and meter mapping',
          onPress: () => mutations.sync.mutate(),
        },
        {
          danger: !visibility.nextVisible,
          disabled: busy,
          icon: visibility.nextVisible ? Eye : EyeOff,
          key: 'visibility',
          label: visibility.title,
          meta: visibility.allowed ? 'Applies to station, chargers, and ports' : visibility.message,
          onPress: () => {
            if (!visibility.allowed) {
              Alert.alert(visibility.title, visibility.message);
              return;
            }

            Alert.alert(visibility.title, 'Apply this change recursively?', [
              { style: 'cancel', text: 'Cancel' },
              {
                onPress: () =>
                  mutations.visibility.mutate({
                    id: location.id,
                    visible: visibility.nextVisible,
                  }),
                style: visibility.nextVisible ? 'default' : 'destructive',
                text: visibility.nextVisible ? 'Show' : 'Hide',
              },
            ]);
          },
        },
        ...(location.deletedAt
          ? [
              {
                danger: true,
                disabled: busy,
                icon: Undo2,
                key: 'restore',
                label: 'Restore location',
                meta: 'Remove deleted marker and restore the original name',
                onPress: () =>
                  Alert.alert('Restore location', 'This action will make the location available again.', [
                    { style: 'cancel', text: 'Cancel' },
                    {
                      onPress: () => mutations.restore.mutate({ id: location.id, name: location.name }),
                      text: 'Restore',
                    },
                  ]),
              },
            ]
          : []),
      ]}
    />
  );
}
