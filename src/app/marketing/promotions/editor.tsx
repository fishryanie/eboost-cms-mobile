import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function PromotionsEditorPage() {
  return <CmsEditorRoute fallbackHref='/marketing/promotions' pageKey='promotions' />;
}
