import { useEffect, useEffectEvent, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router, type Href, useRootNavigationState } from 'expo-router';

import { getNotificationDeviceToken } from 'utils/notifications/device-token';
import { getNotificationRoute } from 'utils/notifications/notification-route';

export interface PushNotificationState {
  devicePushToken?: string;
  notification?: Notifications.Notification;
}

export const useNotifications = (): PushNotificationState => {
  const [devicePushToken, setDevicePushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  const rootNavigationState = useRootNavigationState();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const navigationReadyRef = useRef(false);
  const navigationFrameRef = useRef<number | null>(null);
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);
  const handledResponseIdsRef = useRef(new Set<string>());

  const openNotificationResponse = useEffectEvent((response: Notifications.NotificationResponse) => {
    const responseId = response.notification.request.identifier;

    if (handledResponseIdsRef.current.has(responseId)) {
      return;
    }

    if (!navigationReadyRef.current) {
      pendingResponseRef.current = response;
      return;
    }

    handledResponseIdsRef.current.add(responseId);
    pendingResponseRef.current = null;

    const route = getNotificationRoute(response.notification.request.content.data);
    navigationFrameRef.current = requestAnimationFrame(() => {
      router.push(route as Href);
      Notifications.clearLastNotificationResponse();
      navigationFrameRef.current = null;
    });
  });

  useEffect(() => {
    let isActive = true;

    getNotificationDeviceToken().then(token => {
      if (isActive) {
        setDevicePushToken(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      openNotificationResponse(response);
    });

    return () => {
      isActive = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    navigationReadyRef.current = Boolean(rootNavigationState?.key);
    if (navigationReadyRef.current && pendingResponseRef.current) {
      openNotificationResponse(pendingResponseRef.current);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    if (lastNotificationResponse) {
      openNotificationResponse(lastNotificationResponse);
    }
  }, [lastNotificationResponse]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current !== null) {
        cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  return {
    devicePushToken,
    notification,
  };
};
