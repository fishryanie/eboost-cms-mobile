import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function TariffEditorPage() {
  return <CmsEditorRoute fallbackHref='/operation/tariff' pageKey='tariff' />;
}
