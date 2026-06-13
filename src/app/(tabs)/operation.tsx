import { CmsSectionScreen } from 'features/cms-menu/cms-section-screen';
import { getCmsMobileSection } from 'features/cms-menu/mobile-cms-menu';

export default function OperationTabScreen() {
  return <CmsSectionScreen section={getCmsMobileSection('operation')} />;
}
