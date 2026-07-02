export type ScheduleNoticeValues = {
  contentEn: string;
  contentVn: string;
  description?: string;
  descriptionVn?: string;
  messageEn: string;
  messageVn: string;
  nameVn: string;
  scheduledAt: string;
  target: string;
  templateName: string;
  titleEn: string;
  titleVn: string;
  version?: string;
};

export type NoticeTemplateResponse = {
  id?: number;
  iriId?: string;
  name?: string;
};
