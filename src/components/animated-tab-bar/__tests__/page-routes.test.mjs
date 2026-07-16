import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const projectRoot = new URL('../../../../', import.meta.url);

const pageRoutes = {
  marketing: ['advertisements', 'bonus-topup', 'notification-message-templates', 'notifications', 'pop-up-ads', 'promotions', 'referral-gift', 'subscriptions'],
  operation: ['brands', 'contents', 'locations', 'opening-hours', 'payments', 'reservations', 'tariff', 'transactions', 'users'],
};

const editorRoutes = {
  marketing: ['advertisements', 'bonus-topup', 'notification-message-templates', 'pop-up-ads', 'promotions', 'referral-gift', 'subscriptions'],
  operation: ['brands', 'contents', 'opening-hours', 'reservations', 'tariff'],
};

describe('CMS page routes', () => {
  it('keeps every menu page in its own route folder', () => {
    for (const [section, pages] of Object.entries(pageRoutes)) {
      for (const page of pages) {
        assert.equal(existsSync(new URL(`src/app/${section}/${page}/index.tsx`, projectRoot)), true, `${section}/${page}`);
      }
    }
  });

  it('keeps each editor under its parent page', () => {
    for (const [section, pages] of Object.entries(editorRoutes)) {
      for (const page of pages) {
        assert.equal(existsSync(new URL(`src/app/${section}/${page}/editor.tsx`, projectRoot)), true, `${section}/${page}/editor`);
      }
    }
  });

  it('does not route CMS pages through a dynamic panel', () => {
    assert.equal(existsSync(new URL('src/app/marketing/[panel]/index.tsx', projectRoot)), false);
    assert.equal(existsSync(new URL('src/app/operation/[panel]/index.tsx', projectRoot)), false);
    assert.equal(existsSync(new URL('src/app/cms-editor/[panel]/[section].tsx', projectRoot)), false);

    const headerSource = readFileSync(new URL('src/components/home-header.tsx', projectRoot), 'utf8');
    const popupSource = readFileSync(new URL('src/components/animated-tab-bar/popup.tsx', projectRoot), 'utf8');
    assert.doesNotMatch(headerSource, /\[panel\]/);
    assert.doesNotMatch(popupSource, /\[panel\]/);
  });
});
