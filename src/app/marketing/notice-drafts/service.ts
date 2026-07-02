import { apiRequest } from 'utils/api/client';
import type { NoticeDraftResponse, NoticeDraftValues, NotificationImageAsset } from './types';

type UploadImageResponse = {
  file_path?: string;
  results?: { media?: { url?: string } }[];
};

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

export function normalizeNoticeDraftValues(values: NoticeDraftValues, imageUrl?: string) {
  const description = values.description?.trim() || values.messageEn.trim();
  const descriptionVn = values.descriptionVn?.trim() || values.messageVn.trim();

  return {
    contentEn: values.contentEn.trim(),
    contentVn: values.contentVn.trim(),
    description,
    descriptionVn,
    imageUrl,
    messageEn: values.messageEn.trim(),
    messageVn: values.messageVn.trim(),
    name: values.name.trim(),
    nameVn: values.nameVn.trim(),
    titleEn: values.titleEn.trim(),
    titleVn: values.titleVn.trim(),
    version: values.version?.trim() || null,
  };
}

export async function createNoticeDraft(values: NoticeDraftValues) {
  const imageUrl = await uploadNotificationImage(values.image);

  return apiRequest<NoticeDraftResponse>('api/notification_message_templates', {
    data: normalizeNoticeDraftValues(values, imageUrl),
    method: 'POST',
  });
}
