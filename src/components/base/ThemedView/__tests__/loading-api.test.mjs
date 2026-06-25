import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../index.tsx', import.meta.url), 'utf8');
const shimmerSource = readFileSync(new URL('../skeleton-shimmer.tsx', import.meta.url), 'utf8');

describe('ThemedView loading API', () => {
  it('exposes skeleton loading props on ThemedViewProps', () => {
    assert.match(source, /loading\?: boolean/);
    assert.match(source, /skeletonBaseColor\?: string/);
    assert.match(source, /skeletonShimmerColor\?: string/);
    assert.match(source, /skeletonDuration\?: number/);
  });

  it('renders skeleton shimmer instead of children while loading', () => {
    assert.match(source, /loading \? undefined : children/);
    assert.match(source, /loading &&/);
    assert.match(source, /SkeletonShimmer/);
  });

  it('keeps shimmer animation in a separate module', () => {
    assert.match(source, /from '\.\/skeleton-shimmer'/);
    assert.doesNotMatch(source, /expo-linear-gradient/);
    assert.match(shimmerSource, /expo-linear-gradient/);
    assert.match(shimmerSource, /react-native-reanimated/);
  });
});
