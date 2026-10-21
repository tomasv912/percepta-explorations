export type Style = 'mono' | 'variation';
export type Shape = 'square' | 'circle';

export interface Params {
  seed: number;
  // network
  clusters: number;
  nodes: number;
  connectivity: number;
  branching: number;
  curvature: number;
  // deformation
  noiseFreq: number;
  noiseAmp: number;
  octaves: number;
  warp: number;
  // density field
  pathWidth: number;
  noiseMix: number;
  threshold: number;
  contrast: number;
  // pixels
  style: Style;
  shape: Shape;
  count: number;
  size: number;
  mod: number;
  variation: number;
  grain: number;
  clump: number;
  stragglers: number;
  // activation
  actIntensity: number;
  actSpeed: number;
  actDecay: number;
  actFreq: number;
  // output
  fg: string;
  bg: string;
  width: number;
  height: number;
  margin: number;
  debug: boolean;
}

export const DEFAULTS: Params = {
  seed: 7,
  clusters: 5, nodes: 260, connectivity: 0.35, branching: 0.5, curvature: 0.45,
  noiseFreq: 1.6, noiseAmp: 0.05, octaves: 3, warp: 0.5,
  pathWidth: 4.5, noiseMix: 0.3, threshold: 0.1, contrast: 1.4,
  style: 'mono', shape: 'square', count: 32000, size: 3, mod: 0.6, variation: 0.4, grain: 0.05, clump: 0.45, stragglers: 0.04,
  actIntensity: 0.5, actSpeed: 160, actDecay: 0.7, actFreq: 0.6,
  fg: '#151412', bg: '#ecebe6', width: 1600, height: 1000, margin: 0.06, debug: false,
};

export const PRESETS: Record<string, Partial<Params>> = {
  Emergence: {
    clusters: 4, nodes: 180, connectivity: 0.2, branching: 0.65, curvature: 0.55,
    noiseFreq: 1.4, noiseAmp: 0.06, octaves: 4, warp: 0.7,
    pathWidth: 4.5, noiseMix: 0.45, threshold: 0.14, contrast: 1.2,
    style: 'variation', shape: 'square', count: 26000, size: 3.2, mod: 0.6, variation: 0.45, grain: 0.06, clump: 0.5, stragglers: 0.05,
  },
  'Neural Pathways': {
    clusters: 6, nodes: 320, connectivity: 0.45, branching: 0.4, curvature: 0.35,
    noiseFreq: 1.8, noiseAmp: 0.04, octaves: 3, warp: 0.4,
    pathWidth: 3.5, noiseMix: 0.2, threshold: 0.08, contrast: 1.7,
    style: 'mono', shape: 'square', count: 30000, size: 2.6, mod: 0.6, variation: 0.4, grain: 0.05, clump: 0.3, stragglers: 0.03,
  },
  'Dense Intelligence': {
    clusters: 9, nodes: 700, connectivity: 0.7, branching: 0.55, curvature: 0.4,
    noiseFreq: 2.2, noiseAmp: 0.05, octaves: 5, warp: 0.55,
    pathWidth: 3.5, noiseMix: 0.3, threshold: 0.1, contrast: 1.4,
    style: 'variation', shape: 'square', count: 70000, size: 2.4, mod: 0.7, variation: 0.35, grain: 0.05, clump: 0.6, stragglers: 0.04,
  },
  'Minimal Structure': {
    clusters: 3, nodes: 90, connectivity: 0.1, branching: 0.25, curvature: 0.25,
    noiseFreq: 1.2, noiseAmp: 0.03, octaves: 3, warp: 0.25,
    pathWidth: 3, noiseMix: 0.1, threshold: 0.1, contrast: 2,
    style: 'mono', shape: 'square', count: 9000, size: 3.5, mod: 0.6, variation: 0.4, grain: 0.05, clump: 0.2, stragglers: 0.08,
  },
};
