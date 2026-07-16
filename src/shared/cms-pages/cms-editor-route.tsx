import { Redirect, useLocalSearchParams } from 'expo-router';

import { CmsEditorPage } from './cms-editor-page';
import type { CmsPageKey } from './config';

export function CmsEditorRoute({ fallbackHref, pageKey }: { fallbackHref: string; pageKey: CmsPageKey }) {
  const params = useLocalSearchParams<{
    id?: string | string[];
    mode?: string | string[];
    section?: string | string[];
  }>();
  const section = Array.isArray(params.section) ? params.section[0] : params.section;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) === 'update' ? 'update' : 'create';

  if (!section) {
    return <Redirect href={fallbackHref as never} />;
  }

  return <CmsEditorPage id={id} mode={mode} pageKey={pageKey} sectionKey={section} />;
}
