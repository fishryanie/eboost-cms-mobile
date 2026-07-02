export type PushNoticeMode = 'topic' | 'user';

export type NotificationImageAsset = {
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
};

export type NotificationTopicOption = {
  name: string;
  topic: string;
  type?: string;
};

export type NotificationTopicGroup = {
  data?: NotificationTopicOption[];
  total_items?: number;
  type: string;
};

export type PushNoticeValues = {
  contentEn?: string;
  contentVn?: string;
  image?: NotificationImageAsset | null;
  messageEn: string;
  messageVn: string;
  mode: PushNoticeMode;
  target: string;
  titleEn: string;
  titleVn: string;
};

export type PushNoticeResponse = {
  message?: string;
  success?: boolean;
};
