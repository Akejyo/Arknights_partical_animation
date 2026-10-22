export type ParticleSource = string | HTMLImageElement | HTMLCanvasElement | ImageBitmap;
export interface ParticleOptions {
  gap?: number; size?: number; maxParticles?: number; color?: string; shape?: 'circle' | 'square';
  gamma?: number; threshold?: number; mode?: 'brightness' | 'dark' | 'alpha'; jitter?: number;
  duration?: number; scatter?: number; padding?: number; pixelRatio?: number;
  pointerMode?: 'inverse' | 'local'; pointerScope?: 'window' | 'container';
  pointerRadius?: number; pointerStrength?: number; returnTime?: readonly [number, number];
  drift?: number; driftPeriod?: number;
  autoPause?: boolean; respectReducedMotion?: boolean; cacheSize?: number; loadTimeout?: number;
}
export interface ParticleStats {
  readonly particles: number; readonly targets: number;
  readonly width: number; readonly height: number;
  readonly running: boolean; readonly reducedMotion: boolean; readonly destroyed: boolean;
}
export declare const defaults: Readonly<Required<ParticleOptions>>;
export declare class ParticleMorph {
  constructor(container: string | HTMLElement, options?: ParticleOptions);
  readonly canvas: HTMLCanvasElement;
  readonly options: Readonly<Required<ParticleOptions>>;
  /** true: installed; false: superseded/destroyed. Does not await animation. */
  show(source: ParticleSource): Promise<boolean>;
  preload(sources: ParticleSource[]): Promise<void>;
  pause(): void;
  resume(): void;
  resize(): void;
  readonly stats: ParticleStats;
  destroy(): void;
}
export default ParticleMorph;
