import { useRouter } from 'expo-router';
import { AccessMessage } from 'features/admin-access/access-guard';
import { useCurrentAdminAccess } from 'features/admin-access/hooks';
import { getCmsSectionScreen } from 'features/admin-access/model';

import { CmsPageScreen } from './cms-page-screen';
import { cmsPageConfigs, type CmsPageKey } from './config';

export function CmsPageRoute({ editorPathname, pageKey }: { editorPathname?: string; pageKey: CmsPageKey }) {
  const router = useRouter();
  const access = useCurrentAdminAccess();
  const config = cmsPageConfigs[pageKey];
  const sections = config.sections.filter(section => access.canAccess(getCmsSectionScreen(pageKey, section.key)));

  if (!sections.length) return <AccessMessage />;

  return <CmsPageScreen config={{ ...config, sections }} editorPathname={editorPathname} onBack={() => router.back()} />;
}
