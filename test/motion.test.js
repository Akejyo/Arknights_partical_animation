import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerFactor, relaxOffset, particleProgress, followTarget } from '../src/motion.js';

test('inverse interaction affects distant particles and decays without a cutoff', () => {
  const velocity = d => d * pointerFactor(d, 28);
  assert.ok(velocity(300) > 0 && velocity(1000) > 0);
  assert.ok(velocity(100) > velocity(300));
  assert.ok(Math.abs(velocity(300) / velocity(600) - 2) < 0.02);
  assert.ok(Math.abs(velocity(99.999) - velocity(100.001)) < 0.01);
});
test('exact pointer coincidence yields finite zero force', () => {
  assert.equal(0 * pointerFactor(0, 28), 0);
  assert.ok(Number.isFinite(relaxOffset(0, 0, 16, 400)));
});

test('proportional image and pointer scaling preserves relative inverse motion', () => {
  for (const scale of [0.25, 0.5, 1, 2, 4]) {
    for (const distance of [1, 10, 100, 500]) {
      const baseline = distance * pointerFactor(distance,28);
      const resized = distance * scale * pointerFactor(distance * scale,28,scale);
      assert.ok(Math.abs(resized / scale - baseline) < 1e-9);
    }
  }
});
test('return motion is consistent at 60, 120 and 165 Hz', () => {
  const simulate = fps => {
    let offset = 100;
    for (let i = 0; i < fps; i++) offset = relaxOffset(offset, 0, 1000/fps, 400);
    return offset;
  };
  for (const fps of [60,120,165]) assert.ok(Math.abs(simulate(fps) - 100*Math.exp(-2.5)) < 1e-9);
});
test('different return times have different settling rates, with no perpetual drift', () => {
  assert.ok(relaxOffset(100, 0, 100, 330) < relaxOffset(100, 0, 100, 500));
  assert.equal(relaxOffset(0, 0, 100, 400), 0);
});
test('per-particle morph timing varies while all particles finish at duration', () => {
  assert.ok(particleProgress(0.5,330,415) > particleProgress(0.5,500,415));
  for (const tau of [330,415,500]) {
    assert.equal(particleProgress(0,tau,415),0);
    assert.equal(particleProgress(1,tau,415),1);
  }
});

test('natural morph moves immediately and slows with the remaining distance', () => {
  const a = followTarget(0,100,16,400);
  const b = followTarget(a,100,16,400);
  assert.ok(a > 0 && b > a && b-a < a);
  assert.ok(followTarget(0,500,16,400) > a*4.99);
});
test('natural morph has no shared deadline and can retarget from its live position', () => {
  const fast = followTarget(0,100,1100,330);
  const slow = followTarget(0,100,1100,500);
  assert.ok(fast > slow && fast < 100 && slow < 100);
  assert.equal(followTarget(fast,-100,0,330),fast);
  const next = followTarget(fast,-100,16,330);
  assert.ok(next < fast && next > -100);
});
