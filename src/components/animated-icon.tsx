import { ThemedView } from 'components/base';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const { height, width } = useWindowDimensions();

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    65: {
      opacity: 1,
    },
    100: {
      opacity: 0,
      easing: Easing.out(Easing.cubic),
    },
  });

  return (
    <AnimatedThemedView
      entering={splashKeyframe.duration(DURATION).withCallback(finished => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.backgroundSolidColor}>
      <Image contentFit='cover' source={require('assets/images/cms-splash.png')} style={{ height, width }} />
    </AnimatedThemedView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
