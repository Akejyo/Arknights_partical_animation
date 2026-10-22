/** Velocity coefficient multiplied by the vector away from the pointer.
 * Its magnitude approaches 1/distance without a hard cutoff. */
export function pointerFactor(distance, strength) {
  return strength * 360 / ((1 + distance) * (1 + distance));
}

/** Exact first-order relaxation with a constant external velocity over dt. */
export function relaxOffset(offset, velocity, dt, returnTime) {
  const decay = Math.exp(-dt / returnTime);
  return offset * decay + velocity * (returnTime / 1000) * (1 - decay);
}

/** Different per-particle timing, with the same exact transition end time. */
export function particleProgress(progress, returnTime, meanReturnTime) {
  return 1 - Math.pow(1 - progress, meanReturnTime / returnTime);
}
