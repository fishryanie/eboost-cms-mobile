import { CmsEditorRoute } from 'shared/cms-pages/cms-editor-route';

export default function ContentsEditorPage() {
  return <CmsEditorRoute fallbackHref='/operation/contents' pageKey='contents' />;
}
