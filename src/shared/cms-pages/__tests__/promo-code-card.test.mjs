import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function loadModule(path, dependencies = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: name => dependencies[name] ?? require(name),
  });
  return exports;
}

const promoCardModule = loadModule('../promo-code-card.tsx', {
  'components/base': { ThemedText: () => null, ThemedView: () => null },
  'expo-clipboard': { setStringAsync: async () => true },
  'expo-haptics': { notificationAsync: async () => undefined, NotificationFeedbackType: { Success: 'success' } },
  'lucide-react-native': new Proxy({}, { get: () => () => null }),
  'react-native': { Pressable: () => null },
  themes: { FontFamily: {}, Palette: {} },
  'themes/scaling': { mhs: v => v, mvs: v => v },
});

const configModule = loadModule('../config.ts', {
  'utils/api/client': {},
  themes: { Palette: {} },
  'themes/scaling': { mhs: v => v },
});

describe('PromoCodeCard & helpers parity with Web CMS', () => {
  it('calculates active promo validity and days left matching web status', () => {
    const now = Date.now();
    const startAt = new Date(now - 86_400_000 * 2).toISOString();
    const expiredAt = new Date(now + 86_400_000 * 31).toISOString();

    const validity = promoCardModule.calculatePromoValidity(startAt, expiredAt);
    assert.equal(validity.tone, 'active');
    assert.match(validity.label, /3[01] days left/);
    assert.equal(validity.durationDays, 33);
  });

  it('marks expired promo validity properly', () => {
    const now = Date.now();
    const startAt = new Date(now - 86_400_000 * 40).toISOString();
    const expiredAt = new Date(now - 86_400_000 * 5).toISOString();

    const validity = promoCardModule.calculatePromoValidity(startAt, expiredAt);
    assert.equal(validity.tone, 'expired');
    assert.equal(validity.label, 'Expired');
  });

  it('resolves vehicle types accurately for bike, car and all', () => {
    assert.equal(promoCardModule.getPromoVehicleInfo('bike').type, 'bike');
    assert.equal(promoCardModule.getPromoVehicleInfo('1').type, 'bike');
    assert.equal(promoCardModule.getPromoVehicleInfo('car').type, 'car');
    assert.equal(promoCardModule.getPromoVehicleInfo('2').type, 'car');
    assert.equal(promoCardModule.getPromoVehicleInfo('0').type, 'all');
    assert.equal(promoCardModule.getPromoVehicleInfo(0).type, 'all');
  });

  it('extracts audience summary for unrestricted users and boxes', () => {
    const summary = promoCardModule.getPromoAudienceSummary({
      vehicleType: 'bike',
    });
    assert.equal(summary.isUsersAll, true);
    assert.equal(summary.usersLabel, 'All users');
    assert.equal(summary.isBoxesAll, true);
    assert.equal(summary.boxesLabel, 'All boxes');
  });

  it('extracts audience summary for targeted users and targeted boxes', () => {
    const summary = promoCardModule.getPromoAudienceSummary({
      promotionCodeBoxes: [{ boxUniqueId: 'BBox_0408' }],
      promotionCodeUsers: [{ user: '/api/users/51396' }],
      km: 18,
    });
    assert.equal(summary.isUsersAll, false);
    assert.equal(summary.usersLabel, 'User: 51396');
    assert.equal(summary.isBoxesAll, false);
    assert.equal(summary.boxesLabel, 'Box: BBox_0408');
    assert.equal(summary.kmLabel, '18 km');
  });

  it('configures CMS promotions page to use promo-code itemVariant and prioritize promo code as title', () => {
    const plain = value => JSON.parse(JSON.stringify(value));
    const promotions = configModule.cmsPageConfigs.promotions;
    assert.ok(promotions, 'promotions config exists');

    const charging = promotions.sections.find(s => s.key === 'charging');
    assert.ok(charging, 'charging section exists');
    assert.equal(charging.itemVariant, 'promo-code');
    assert.equal(plain(charging.titlePaths[0]), 'code');

    const wallet = promotions.sections.find(s => s.key === 'wallet');
    assert.ok(wallet, 'wallet section exists');
    assert.equal(wallet.itemVariant, 'promo-code');
    assert.equal(plain(wallet.titlePaths[0]), 'code');
  });
});
