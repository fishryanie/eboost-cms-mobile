import { Pressable } from 'react-native';

import { ThemedText, ThemedView } from 'components/base';
import { FontFamily, Palette } from 'themes';

import { styles } from 'components/technical/styles';

export function VehicleSwitch({ onChange, vehicle }: { onChange: (vehicle: TechnicalVehicle) => void; vehicle: TechnicalVehicle }) {
  return (
    <ThemedView flexDirection='row' gap={'two'}>
      {(['bike', 'car'] as TechnicalVehicle[]).map(option => (
        <Pressable
          accessibilityRole='button'
          key={option}
          onPress={() => onChange(option)}
          style={({ pressed }) => [styles.vehicleChip, vehicle === option && styles.vehicleChipActive, pressed && styles.pressed]}>
          <ThemedText color={vehicle === option ? Palette.surfaceBase : Palette.textSecondary} fontFamily={FontFamily.semibold} fontSize={12} lineHeight={17}>
            {option === 'bike' ? 'Bike' : 'Car'}
          </ThemedText>
        </Pressable>
      ))}
    </ThemedView>
  );
}
