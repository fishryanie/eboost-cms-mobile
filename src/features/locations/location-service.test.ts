import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLocation, uploadLocationImage } from './location-service';

describe('location service', () => {
  it('creates a location with a name', async () => {
    const calls: { options?: unknown; url: string }[] = [];
    const request = async <TResponse>(url: string, options?: unknown): Promise<TResponse> => {
      calls.push({ options, url });
      return { id: 11, name: 'District 1 Hub' } as TResponse;
    };

    const result = await createLocation({ name: 'District 1 Hub' }, request);

    assert.deepEqual(result, { id: 11, name: 'District 1 Hub' });
    assert.equal(calls[0]?.url, 'api/locations');
    assert.deepEqual(calls[0]?.options, {
      data: { name: 'District 1 Hub' },
      method: 'POST',
    });
  });

  it('uploads location images through the controller endpoint', async () => {
    const calls: { options?: unknown; url: string }[] = [];
    const request = async <TResponse>(url: string, options?: unknown): Promise<TResponse> => {
      calls.push({ options, url });
      return { id: 11, name: 'District 1 Hub' } as TResponse;
    };
    const file = new Blob(['image-bytes'], { type: 'image/jpeg' });

    await uploadLocationImage(
      {
        file,
        id: 11,
      },
      request,
    );

    assert.equal(calls[0]?.url, 'api/controller/image/upload/11/location');
    assert.equal((calls[0]?.options as { method?: string })?.method, 'POST');
    assert.equal((calls[0]?.options as { data?: FormData })?.data instanceof FormData, true);
    const uploadedFile = (calls[0]?.options as { data: FormData }).data.get('file');
    assert.equal(uploadedFile instanceof Blob, true);
    assert.equal((uploadedFile as Blob).size, file.size);
    assert.equal((uploadedFile as Blob).type, file.type);
  });
});
