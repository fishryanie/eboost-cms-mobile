import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const sectionSource = readFileSync(new URL('../marketing-services.tsx', import.meta.url), 'utf8');
const projectRoot = new URL('../../../../../..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, projectRoot), 'utf8');
}

const quickServiceFolders = [
  'push-notice',
  'schedule-notice',
  'notice-drafts',
  'create-promo-code',
  'create-bonus-campaign',
  'extend-package',
  'suspend-package',
];

describe('marketing quick service routes', () => {
  it('routes marketing quick services to task pages instead of panel pages', () => {
    for (const folder of quickServiceFolders) {
      assert.match(sectionSource, new RegExp(`/${folder}`));
    }
    assert.doesNotMatch(sectionSource, /pathname: '\/marketing\/\[panel\]'/);
  });

  it('keeps each marketing quick service in its own route folder', () => {
    for (const folder of quickServiceFolders) {
      assert.equal(existsSync(new URL(`src/app/marketing/${folder}/index.tsx`, projectRoot)), true);
      assert.equal(existsSync(new URL(`src/app/marketing/${folder}/service.ts`, projectRoot)), true);
      assert.equal(existsSync(new URL(`src/app/marketing/${folder}/types.ts`, projectRoot)), true);
    }
    assert.equal(existsSync(new URL('src/app/marketing/push-notice/topic-select-sheet.tsx', projectRoot)), true);
    assert.equal(existsSync(new URL('src/app/marketing/create-promo-code/charger-select-sheet.tsx', projectRoot)), true);
    assert.equal(existsSync(new URL('src/app/marketing/create-promo-code/vehicle-type-select-sheet.tsx', projectRoot)), true);
    assert.equal(existsSync(new URL('src/app/marketing/extend-package/package-select-sheet.tsx', projectRoot)), true);
    assert.equal(existsSync(new URL('src/app/marketing/extend-package/promo-code-select-sheet.tsx', projectRoot)), true);
    assert.equal(existsSync(new URL('src/app/marketing/suspend-package/package-select-sheet.tsx', projectRoot)), true);
  });

  it('opens selector lists from form inputs', () => {
    const pushScreen = readProjectFile('src/app/marketing/push-notice/index.tsx');
    const promoScreen = readProjectFile('src/app/marketing/create-promo-code/index.tsx');
    const extendScreen = readProjectFile('src/app/marketing/extend-package/index.tsx');
    const suspendScreen = readProjectFile('src/app/marketing/suspend-package/index.tsx');

    assert.match(pushScreen, /TopicSelectSheet/);
    assert.match(promoScreen, /ChargerSelectSheet/);
    assert.match(promoScreen, /VehicleTypeSelectSheet/);
    assert.doesNotMatch(extendScreen, /PackageSelectSheet/);
    assert.match(suspendScreen, /PackageSelectSheet/);
    assert.match(suspendScreen, /packageSheetRef\.current\?\.present\(\)/);
    assert.match(extendScreen, /PromoCodeSelectSheet/);
    assert.match(extendScreen, /promoCodeSheetRef\.current\?\.present\(\)/);
    assert.match(extendScreen, /DatePicker/);
    assert.match(extendScreen, /datePickerRef\.current\?\.open\(\)/);
    assert.doesNotMatch(extendScreen, /label='\* New Days' value=\{days\} onChangeText=\{setDays\}/);
    assert.match(readProjectFile('src/app/marketing/push-notice/topic-select-sheet.tsx'), /BottomSheetFlatList/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/charger-select-sheet.tsx'), /BottomSheetFlatList/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/vehicle-type-select-sheet.tsx'), /BottomSheetFlatList/);
    assert.match(readProjectFile('src/app/marketing/extend-package/package-select-sheet.tsx'), /BottomSheetFlatList/);
    assert.match(readProjectFile('src/app/marketing/extend-package/promo-code-select-sheet.tsx'), /useInfiniteQuery/);
    assert.match(readProjectFile('src/app/marketing/extend-package/promo-code-select-sheet.tsx'), /onEndReached=\{loadMore\}/);
    assert.match(readProjectFile('src/app/marketing/suspend-package/package-select-sheet.tsx'), /BottomSheetFlatList/);
  });

  it('commits selected marketing packages and closes package sheets immediately', () => {
    const suspendScreen = readProjectFile('src/app/marketing/suspend-package/index.tsx');
    const suspendSheet = readProjectFile('src/app/marketing/suspend-package/package-select-sheet.tsx');

    assert.match(suspendScreen, /setSelectedPackage\(item\)/);
    assert.match(suspendScreen, /setPackageId\(String\(item\.id\)\)/);
    assert.match(suspendScreen, /packageSheetRef\.current\?\.dismiss\(\)/);

    assert.match(suspendSheet, /forwardRef<BottomSheetModal/);
    assert.match(suspendSheet, /onPress=\{\(\) => onSelect\(item\)\}/);
  });

  it('uses web CMS marketing APIs for task services', () => {
    assert.match(readProjectFile('src/app/marketing/push-notice/service.ts'), /api\/controller\/notification\/send-to-user/);
    assert.match(readProjectFile('src/app/marketing/push-notice/service.ts'), /api\/controller\/notification\/send-to-topic/);
    assert.match(readProjectFile('src/app/marketing/push-notice/service.ts'), /api\/controller\/notification\/get-topics/);
    assert.match(readProjectFile('src/app/marketing/push-notice/service.ts'), /api\/controller\/image\/upload\/0\/notification/);
    assert.match(readProjectFile('src/app/marketing/schedule-notice/service.ts'), /api\/notification_message_templates/);
    assert.match(readProjectFile('src/app/marketing/schedule-notice/service.ts'), /api\/controller\/notification\/scheduler\/add-time/);
    assert.match(readProjectFile('src/app/marketing/schedule-notice/service.ts'), /scheduled_times/);
    assert.match(readProjectFile('src/app/marketing/notice-drafts/service.ts'), /api\/notification_message_templates/);
    assert.match(readProjectFile('src/app/marketing/notice-drafts/service.ts'), /api\/controller\/image\/upload\/0\/notification/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/service.ts'), /api\/promotion_codes/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/service.ts'), /api\/promotion_code_users/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/service.ts'), /api\/promotion_code_boxes/);
    assert.match(readProjectFile('src/app/marketing/create-promo-code/service.ts'), /api\/controller\/utilities\/chargers/);
    assert.match(readProjectFile('src/app/marketing/create-bonus-campaign/service.ts'), /api\/money_top_up_events/);
    assert.match(readProjectFile('src/app/marketing/create-bonus-campaign/service.ts'), /api\/money_top_up_bonus_rules/);
    assert.match(readProjectFile('src/app/marketing/create-bonus-campaign/service.ts'), /api\/money_top_up_blacklists/);
    assert.match(readProjectFile('src/app/marketing/extend-package/service.ts'), /api\/promotion_codes/);
    assert.match(readProjectFile('src/app/marketing/extend-package/service.ts'), /days/);
    assert.match(readProjectFile('src/app/marketing/suspend-package/service.ts'), /api\/subscription_packages/);
    assert.match(readProjectFile('src/app/marketing/suspend-package/service.ts'), /fetchSubscriptionPackages/);
  });
});
