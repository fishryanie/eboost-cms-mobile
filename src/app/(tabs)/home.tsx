import { ThemedView } from 'components/base';

import { HomeHeader } from 'components/home-header';
import { BiometricOptInPrompt } from 'features/auth/components/biometric-opt-in-prompt';
import { Palette } from 'themes';

export default function HomeScreen() {
  return (
    <ThemedView backgroundColor={Palette.surfaceBase} flex={1}>
      <HomeHeader />
      <BiometricOptInPrompt />
    </ThemedView>
  );
}
