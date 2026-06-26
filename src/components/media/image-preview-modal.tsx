import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ThemedText, ThemedView } from 'components/base';

import { FontFamily } from 'themes';

import { clampZoomOffset } from 'utils/media/zoom-bounds';

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);
const AnimatedThemedText = Animated.createAnimatedComponent(ThemedText);

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampScale(value: number) {
  'worklet';
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

export function ImagePreviewModal({ imageUrl, onClose, title, visible }: { imageUrl?: string; onClose: () => void; title?: string; visible: boolean }) {
  const { height, width } = useWindowDimensions();
  const scale = useSharedValue(MIN_SCALE);
  const startScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const resetImage = () => {
    scale.set(withTiming(MIN_SCALE, { duration: 180 }));
    translateX.set(withTiming(0, { duration: 180 }));
    translateY.set(withTiming(0, { duration: 180 }));
  };

  const close = () => {
    resetImage();
    onClose();
  };

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.set(scale.get());
    })
    .onUpdate(event => {
      const nextScale = clampScale(startScale.get() * event.scale);
      scale.set(nextScale);
      translateX.set(clampZoomOffset({ containerSize: width, offset: translateX.get(), scale: nextScale }));
      translateY.set(clampZoomOffset({ containerSize: height, offset: translateY.get(), scale: nextScale }));
    })
    .onEnd(() => {
      const nextScale = clampScale(scale.get());
      scale.set(withTiming(nextScale, { duration: 120 }));
      translateX.set(withTiming(clampZoomOffset({ containerSize: width, offset: translateX.get(), scale: nextScale })));
      translateY.set(withTiming(clampZoomOffset({ containerSize: height, offset: translateY.get(), scale: nextScale })));
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.set(translateX.get());
      startY.set(translateY.get());
    })
    .onUpdate(event => {
      if (scale.get() <= MIN_SCALE) return;
      translateX.set(clampZoomOffset({ containerSize: width, offset: startX.get() + event.translationX, scale: scale.get() }));
      translateY.set(clampZoomOffset({ containerSize: height, offset: startY.get() + event.translationY, scale: scale.get() }));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomed = scale.get() > MIN_SCALE;
      const nextScale = zoomed ? MIN_SCALE : 2.5;
      scale.set(withTiming(nextScale, { duration: 180 }));
      translateX.set(withTiming(0, { duration: 180 }));
      translateY.set(withTiming(0, { duration: 180 }));
    });

  const imageGesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }, { scale: scale.get() }],
  }));

  return (
    <Modal
      animationIn='fadeIn'
      animationInTiming={260}
      animationOut='fadeOut'
      animationOutTiming={220}
      backdropColor='#000000'
      backdropOpacity={1}
      backdropTransitionInTiming={260}
      backdropTransitionOutTiming={220}
      hideModalContentWhileAnimating
      isVisible={visible}
      onBackButtonPress={close}
      statusBarTranslucent
      style={styles.modal}>
      <GestureHandlerRootView style={styles.overlay}>
        <ThemedView
          alignItems='center'
          flexDirection='row'
          gap={'three'}
          justifyContent='space-between'
          left={0}
          paddingHorizontal={'four'}
          paddingTop={54}
          position='absolute'
          right={0}
          top={0}
          zIndex={2}>
          <ThemedText numberOfLines={1} color='#FFFFFF' flex={1} fontFamily={FontFamily.semibold} fontSize={15} lineHeight={20}>
            {title || 'Image'}
          </ThemedText>
          <Pressable accessibilityLabel='Close image preview' onPress={close} style={styles.closeButton}>
            <SymbolView name='xmark' resizeMode='scaleAspectFit' size={18} tintColor='#FFFFFF' />
          </Pressable>
        </ThemedView>

        {imageUrl ? (
          <GestureDetector gesture={imageGesture}>
            <AnimatedThemedView style={[styles.imageWrap, imageStyle]}>
              <Image contentFit='contain' source={{ uri: imageUrl }} style={styles.image} />
            </AnimatedThemedView>
          </GestureDetector>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrap: {
    height: '100%',
    width: '100%',
  },
  modal: {
    margin: 0,
  },
  overlay: {
    backgroundColor: '#000000',
    flex: 1,
  },
});
