import { CmsSectionScreen } from 'features/cms-menu/cms-section-screen';
import { getCmsMobileSection } from 'features/cms-menu/mobile-cms-menu';

export default function MarketingTabScreen() {
  return <CmsSectionScreen section={getCmsMobileSection('marketing')} />;
}
