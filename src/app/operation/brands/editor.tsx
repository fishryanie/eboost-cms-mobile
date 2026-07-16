import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function BrandsEditorPage() {
  return <CmsEditorRoute fallbackHref='/operation/brands' pageKey='brands' />;
}
