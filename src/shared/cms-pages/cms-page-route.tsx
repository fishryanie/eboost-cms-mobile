import { useRouter } from 'expo-router';

import { CmsPageScreen } from './cms-page-screen';
import { cmsPageConfigs, type CmsPageKey } from './config';

export function CmsPageRoute({ editorPathname, pageKey }: { editorPathname?: string; pageKey: CmsPageKey }) {
  const router = useRouter();

  return <CmsPageScreen config={cmsPageConfigs[pageKey]} editorPathname={editorPathname} onBack={() => router.back()} />;
}
