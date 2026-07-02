export type NotificationImageAsset = {
  fileName?: string | null;
  mimeType?: string | null;
  uri: string;
};

export type NoticeDraftValues = {
  contentEn: string;
  contentVn: string;
  description?: string;
  descriptionVn?: string;
  image?: NotificationImageAsset | null;
  messageEn: string;
  messageVn: string;
  name: string;
  nameVn: string;
  titleEn: string;
  titleVn: string;
  version?: string;
};

export type NoticeDraftResponse = {
  id?: number;
  name?: string;
};
