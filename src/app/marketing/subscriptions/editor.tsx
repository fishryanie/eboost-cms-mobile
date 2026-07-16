import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function SubscriptionsEditorPage() {
  return <CmsEditorRoute fallbackHref='/marketing/subscriptions' pageKey='subscriptions' />;
}
