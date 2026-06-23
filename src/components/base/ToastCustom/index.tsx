import { ThemedText, ThemedView } from 'components/base';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast, { ToastConfigParams } from 'react-native-toast-message';
import { Palette } from 'themes';
import { rhs, width } from 'themes/scaling';

const iconToast = {
  success: require('./toastSuccessIcon.png'),
  warning: require('./toastWarningIcon.png'),
  error: require('./toastErrorIcon.png'),
};

const textColor = {
  success: '#1f8722',
  warning: '#f08135',
  error: '#d9100a',
};

const bgIconToast = {
  success: '#def1d7',
  warning: '#fef7ec',
  error: '#fae1db',
};

export type ToastCustomProps = {
  status: 'error' | 'success' | 'warning';
  action?: { title: string; onPress: () => void };
};

const toastConfig = {
  success: (props: ToastConfigParams<any>) => <ToastMessage {...props} props={{ ...props.props, status: 'success' }} />,
  error: (props: ToastConfigParams<any>) => <ToastMessage {...props} props={{ ...props.props, status: 'error' }} />,
  warning: (props: ToastConfigParams<any>) => <ToastMessage {...props} props={{ ...props.props, status: 'warning' }} />,
};

export const ToastManager = () => {
  const { top } = useSafeAreaInsets();
  return <Toast topOffset={top + 12} visibilityTime={3000} config={toastConfig} />;
};

export const ToastMessage = (params: ToastConfigParams<ToastCustomProps>) => {
  const { text1, text2, props } = params;
  const status = props?.status || 'success';
  const action = props?.action;

  return (
    <ThemedView radius={18} padding={12} width={rhs(width - 30)} borderColor={textColor[status]} backgroundColor={bgIconToast[status]}>
      <ThemedView row alignItems={text2 ? undefined : 'center'}>
        <Image style={{ width: 30, height: 30 }} source={iconToast[status]} />
        <ThemedView flex={1} marginLeft={15}>
          {!!text1 && (
            <ThemedText fontFamily='semiBold' fontSize={16} color={textColor[status]}>
              {text1}
            </ThemedText>
          )}
          {!!text2 && <ThemedText color={textColor[status]}>{text2}</ThemedText>}
        </ThemedView>
        <Pressable style={{ justifyContent: 'center', alignItems: 'center', width: 30, height: 30 }} onPress={() => Toast.hide()}>
          <X color={Palette.textSecondary} size={24} />
        </Pressable>
      </ThemedView>
      {action && (
        <Pressable
          style={{ marginLeft: 45, marginTop: 12 }}
          onPress={() => {
            Toast.hide();
            action.onPress();
          }}>
          <ThemedText fontSize={14} fontFamily='semiBold' color={textColor[status]}>
            {action?.title}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
};
