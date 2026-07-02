import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const sectionSource = readFileSync(new URL('../charger-services-section.tsx', import.meta.url), 'utf8');
const projectRoot = new URL('../../../../../..', import.meta.url);

function readProjectFile(path) {
  return readFileSync(new URL(path, projectRoot), 'utf8');
}

describe('technical quick service routes', () => {
  it('routes only unfinished charger quick services to task pages', () => {
    assert.match(sectionSource, /router\.push\('\/technical\/uninstall-charger'/);
    assert.match(sectionSource, /router\.push\('\/technical\/replace-charger'/);
    assert.match(sectionSource, /router\.push\('\/technical\/add-charger'/);
    assert.match(sectionSource, /service\.slug === 'trigger-charger'\s*\?\s*\(\) => onBoxAction\('trigger'\)/);
    assert.match(sectionSource, /service\.slug === 'reset'\s*\?\s*\(\) => onBoxAction\('reset'\)/);
    assert.match(sectionSource, /service\.slug === 'unlock-charger'\s*\?\s*\(\) => onBoxAction\('unlock'\)/);
  });

  it('keeps each unfinished quick service in its own route folder', () => {
    for (const folder of ['uninstall-charger', 'replace-charger', 'add-charger']) {
      assert.equal(existsSync(new URL(`src/app/technical/${folder}/index.tsx`, projectRoot)), true);
      assert.equal(existsSync(new URL(`src/app/technical/${folder}/service.ts`, projectRoot)), true);
      assert.equal(existsSync(new URL(`src/app/technical/${folder}/types.ts`, projectRoot)), true);
    }
  });

  it('uses charger box APIs from the web CMS source for quick tasks', () => {
    const addService = readProjectFile('src/app/technical/add-charger/service.ts');
    const replaceService = readProjectFile('src/app/technical/replace-charger/service.ts');
    const uninstallService = readProjectFile('src/app/technical/uninstall-charger/service.ts');

    assert.match(addService, /api\/car_boxes/);
    assert.match(addService, /api\/bike_boxes/);
    assert.match(replaceService, /method: 'PATCH'/);
    assert.match(uninstallService, /method: 'PATCH'/);
    assert.match(uninstallService, /station: null/);
  });
});
