import { apiRequest } from 'utils/api/client';
import type { NotificationImageAsset, NotificationTopicGroup, NotificationTopicOption, PushNoticeResponse, PushNoticeValues } from './types';

type UploadImageResponse = {
  file_path?: string;
  results?: { media?: { url?: string } }[];
};

type CollectionResponse<T> =
  | T[]
  | {
      data?: T[];
      'hydra:member'?: T[];
      member?: T[];
    };

function unwrapCollection<T>(response: CollectionResponse<T>) {
  if (Array.isArray(response)) return response;
  return response.data || response['hydra:member'] || response.member || [];
}

export function normalizePushNoticeValues(values: PushNoticeValues) {
  return {
    contentEn: values.contentEn?.trim() || '',
    contentVn: values.contentVn?.trim() || '',
    messageEn: values.messageEn.trim(),
    messageVn: values.messageVn.trim(),
    target: values.target.trim(),
    titleEn: values.titleEn.trim(),
    titleVn: values.titleVn.trim(),
  };
}

export async function fetchNotificationTopics() {
  const response = await apiRequest<CollectionResponse<NotificationTopicGroup>>('api/controller/notification/get-topics');
  return unwrapCollection(response).flatMap(group => (group.data || []).map(item => ({ ...item, type: group.type }) satisfies NotificationTopicOption));
}

export async function uploadNotificationImage(image?: NotificationImageAsset | null) {
  if (!image?.uri) return undefined;

  const formData = new FormData();
  formData.append('file', {
    name: image.fileName || 'notification.jpg',
    type: image.mimeType || 'image/jpeg',
    uri: image.uri,
  } as unknown as Blob);

  const response = await apiRequest<UploadImageResponse, FormData>('api/controller/image/upload/0/notification', {
    data: formData,
    method: 'POST',
  });

  return response.results?.[0]?.media?.url || response.file_path;
}

export async function sendPushNotice(values: PushNoticeValues) {
  const payload = normalizePushNoticeValues(values);
  const endpoint = values.mode === 'topic' ? 'api/controller/notification/send-to-topic' : 'api/controller/notification/send-to-user';
  const imageUrl = await uploadNotificationImage(values.image);
  const titleType = payload.contentEn && payload.contentVn ? 'news' : 'noti';

  return apiRequest<PushNoticeResponse>(endpoint, {
    data:
      values.mode === 'topic'
        ? {
            content_en: payload.contentEn,
            content_vn: payload.contentVn,
            image_path: imageUrl,
            image_url: imageUrl,
            message_en: payload.messageEn,
            message_vn: payload.messageVn,
            status: 1,
            title_en: payload.titleEn,
            title_type: titleType,
            title_vn: payload.titleVn,
            topic: payload.target,
          }
        : {
            content_en: payload.contentEn,
            content_vn: payload.contentVn,
            image_path: imageUrl,
            image_url: imageUrl,
            message_en: payload.messageEn,
            message_vn: payload.messageVn,
            status: 1,
            title_en: payload.titleEn,
            title_type: titleType,
            title_vn: payload.titleVn,
            user_ids: payload.target,
          },
    method: 'POST',
  });
}
