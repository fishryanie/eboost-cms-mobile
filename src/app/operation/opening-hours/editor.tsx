import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function OpeningHoursEditorPage() {
  return <CmsEditorRoute fallbackHref='/operation/opening-hours' pageKey='opening-hours' />;
}
