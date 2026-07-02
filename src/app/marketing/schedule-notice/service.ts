import { apiRequest } from 'utils/api/client';
import type { NoticeTemplateResponse, ScheduleNoticeValues } from './types';

export function normalizeScheduleNoticeValues(values: ScheduleNoticeValues) {
  return {
    contentEn: values.contentEn.trim(),
    contentVn: values.contentVn.trim(),
    description: values.description?.trim() || values.messageEn.trim(),
    descriptionVn: values.descriptionVn?.trim() || values.messageVn.trim(),
    messageEn: values.messageEn.trim(),
    messageVn: values.messageVn.trim(),
    name: values.templateName.trim(),
    nameVn: values.nameVn.trim(),
    titleEn: values.titleEn.trim(),
    titleVn: values.titleVn.trim(),
    version: values.version?.trim() || null,
  };
}

export async function scheduleNotice(values: ScheduleNoticeValues) {
  const template = await apiRequest<NoticeTemplateResponse>('api/notification_message_templates', {
    data: normalizeScheduleNoticeValues(values),
    method: 'POST',
  });
  const templateId = template.id;

  if (!templateId) {
    throw new Error('Could not find created template id.');
  }

  await apiRequest(`api/controller/notification/scheduler/add-time/${templateId}`, {
    data: {
      scheduled_times: [
        {
          time: values.scheduledAt.trim(),
          user_list: values.target.trim(),
        },
      ],
    },
    method: 'POST',
  });

  return template;
}
