import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function AdvertisementsEditorPage() {
  return <CmsEditorRoute fallbackHref='/marketing/advertisements' pageKey='advertisements' />;
}
