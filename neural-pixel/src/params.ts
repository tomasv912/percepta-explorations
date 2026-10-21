export type Mode = 'opacity' | 'halftone' | 'binary';
export type Shape = 'circle' | 'square';

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
  mode: Mode;
  shape: Shape;
  spacing: number;
  dotSize: number;
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
  mode: 'opacity', shape: 'circle', spacing: 6, dotSize: 3.4,
  actIntensity: 0.5, actSpeed: 160, actDecay: 0.7, actFreq: 0.6,
  fg: '#151412', bg: '#ecebe6', width: 1600, height: 1000, margin: 0.06, debug: false,
};

export const PRESETS: Record<string, Partial<Params>> = {
  Emergence: {
    clusters: 4, nodes: 180, connectivity: 0.2, branching: 0.65, curvature: 0.55,
    noiseFreq: 1.4, noiseAmp: 0.06, octaves: 4, warp: 0.7,
    pathWidth: 4.5, noiseMix: 0.45, threshold: 0.14, contrast: 1.2,
    mode: 'opacity', shape: 'circle', spacing: 6, dotSize: 3.2,
  },
  'Neural Pathways': {
    clusters: 6, nodes: 320, connectivity: 0.45, branching: 0.4, curvature: 0.35,
    noiseFreq: 1.8, noiseAmp: 0.04, octaves: 3, warp: 0.4,
    pathWidth: 3.5, noiseMix: 0.2, threshold: 0.08, contrast: 1.7,
    mode: 'halftone', shape: 'circle', spacing: 5, dotSize: 4.2,
  },
  'Dense Intelligence': {
    clusters: 9, nodes: 700, connectivity: 0.7, branching: 0.55, curvature: 0.4,
    noiseFreq: 2.2, noiseAmp: 0.05, octaves: 5, warp: 0.55,
    pathWidth: 3.5, noiseMix: 0.3, threshold: 0.1, contrast: 1.4,
    mode: 'halftone', shape: 'circle', spacing: 4.5, dotSize: 3.8,
  },
  'Minimal Structure': {
    clusters: 3, nodes: 90, connectivity: 0.1, branching: 0.25, curvature: 0.25,
    noiseFreq: 1.2, noiseAmp: 0.03, octaves: 3, warp: 0.25,
    pathWidth: 3, noiseMix: 0.1, threshold: 0.1, contrast: 2,
    mode: 'binary', shape: 'square', spacing: 8, dotSize: 6,
  },
};
