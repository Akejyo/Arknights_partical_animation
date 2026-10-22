import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleRGBA, gridSize } from '../src/sampling.js';
const base = { gamma: 1, threshold: 0, mode: 'brightness', jitter: 0 };

test('transparent white pixels do not create particles; alpha is retained', () => {
  const points = sampleRGBA(new Uint8ClampedArray([255,255,255,0,255,255,255,128]), 2, 1, base);
  assert.equal(points.length, 1);
  assert.equal(points[0].x, 0.75);
  assert.ok(Math.abs(points[0].alpha - 128/255) < 1e-6);
});
test('dark and alpha modes cover black logos on transparent backgrounds', () => {
  const rgba = new Uint8ClampedArray([0,0,0,255,255,255,255,255,255,255,255,0]);
  assert.equal(sampleRGBA(rgba, 3, 1, { ...base, mode: 'dark' }).length, 1);
  assert.equal(sampleRGBA(rgba, 3, 1, { ...base, mode: 'alpha' }).length, 2);
});
test('a non-divisible 3 by 2 image produces finite centered targets', () => {
  const points = sampleRGBA(new Uint8ClampedArray(24).fill(255), 3, 2, base);
  assert.equal(points.length, 6);
  assert.ok(points.every(p => Number.isFinite(p.alpha) && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1));
});
test('sampling budget holds for ordinary and extreme aspect ratios', () => {
  for (const [width, height] of [[1920,1080],[1e6,1],[1,1e6],[1,1],[10000,10000]]) {
    for (const budget of [1,10,6000]) {
      const [cols, rows] = gridSize(width, height, 3, budget);
      assert.ok(cols >= 1 && rows >= 1 && cols * rows <= budget);
    }
  }
});
test('gamma and threshold preserve bright regions and filter dark regions', () => {
  const points = sampleRGBA(new Uint8ClampedArray([32,32,32,255,240,240,240,255]), 2, 1,
    { ...base, gamma: 1.8, threshold: 0.08 });
  assert.equal(points.length, 1); assert.equal(points[0].x, 0.75);
});
test('entry point may be imported during SSR without touching the DOM', async () => {
  const { ParticleMorph } = await import('../src/index.js');
  assert.throws(() => new ParticleMorph('#missing'), /after the component mounts/);
});
