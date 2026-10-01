// A sound recipe: layers that are mixed, each with a source (or sub-layers),
// filters, an ADSR envelope, LFOs, a simple echo and optional scattered events
// (a bird now and then, a cup, a knock of bamboo). Pure data, like a text
// drawing: the WAV is always rebuilt from it, and the same recipe + seed gives
// the same bytes.

import { z } from 'zod';

/** A value, or [seconds, value] points (linear in between, held at the ends), relative to the voice start. */
const curve = z.union([z.number(), z.array(z.tuple([z.number(), z.number()])).min(1)]);
export type Curve = z.infer<typeof curve>;

const envelope = z.object({
  attack: z.number().nonnegative().optional().describe('seconds (default 0.005)'),
  decay: z.number().nonnegative().optional().describe('seconds (default 0)'),
  sustain: z.number().min(0).max(1).optional().describe('level after the decay (default 1)'),
  hold: z.number().nonnegative().optional().describe('seconds at the sustain level (default: whatever fills the voice)'),
  release: z.number().nonnegative().optional().describe('seconds (default 0.01)'),
  curve: z.number().positive().optional().describe('exponent of decay and release (1 linear, default 2: falls fast, then tails)'),
});

const filter = z.object({
  type: z.enum(['lowpass', 'highpass', 'bandpass']),
  freq: curve.describe('cutoff / center in Hz, or [t, Hz] points'),
  q: z.number().positive().optional().describe('biquad resonance (default 0.707; bandpass: higher = narrower)'),
  poles: z.union([z.literal(1), z.literal(2)]).optional().describe('1 = gentle one-pole (lowpass/highpass), 2 = biquad (default)'),
});

const lfo = z.object({
  target: z.enum(['gain', 'freq', 'cutoff']),
  rate: z.number().positive().describe('Hz'),
  depth: z.number().describe('gain: 0..1 of the level it can take away; freq: semitones; cutoff: octaves'),
  shape: z.enum(['sine', 'triangle', 'square', 'random']).optional().describe('random = smooth seeded wander (wind, gusts)'),
  phase: z.number().optional().describe('0..1'),
});

const echo = z.object({
  delay: z.number().positive().describe('seconds'),
  feedback: z.number().min(0).max(0.95).optional().describe('default 0.3'),
  mix: z.number().min(0).max(1).optional().describe('default 0.3'),
});

const events = z.object({
  every: z.union([z.number().positive(), z.tuple([z.number().positive(), z.number().positive()])])
    .optional().describe('seconds between events, or [min, max] (seeded)'),
  start: z.number().nonnegative().optional().describe('first event at this time (default: a random point in the first gap)'),
  times: z.array(z.number().nonnegative()).optional().describe('explicit times instead of every'),
  pitch: z.tuple([z.number().positive(), z.number().positive()]).optional().describe('random pitch ratio per event'),
  gain_db: z.tuple([z.number(), z.number()]).optional().describe('random gain per event'),
});

const source = z.object({
  type: z.enum(['sine', 'triangle', 'square', 'saw', 'noise', 'pluck', 'crackle']),
  freq: curve.optional().describe('Hz (oscillators and pluck; default 440)'),
  duty: z.number().min(0.01).max(0.99).optional().describe('square: fraction high (default 0.5)'),
  color: z.enum(['white', 'pink', 'brown']).optional().describe('noise and crackle (default white)'),
  decay: z.number().min(0.5).max(1).optional().describe('pluck: string loss per pass (default 0.996)'),
  damping: z.number().min(0).max(1).optional().describe('pluck: 0 bright … 1 dull (default 0.5)'),
  density: z.number().positive().optional().describe('crackle: bursts per second (default 20)'),
  burst: z.number().positive().optional().describe('crackle: burst length in seconds (default 0.004)'),
});

export interface LayerSpec {
  source?: z.infer<typeof source>;
  layers?: LayerSpec[];
  gain_db?: number;
  start?: number;
  length?: number;
  envelope?: z.infer<typeof envelope>;
  filters?: z.infer<typeof filter>[];
  lfo?: z.infer<typeof lfo>[];
  echo?: z.infer<typeof echo>;
  events?: z.infer<typeof events>;
  seed?: number;
}

export const layerSchema: z.ZodType<LayerSpec> = z.lazy(() => z.object({
  source: source.optional(),
  layers: z.array(layerSchema).optional().describe('sub-layers mixed as one voice (a bell with its partials, a bird call)'),
  gain_db: z.number().optional(),
  start: z.number().nonnegative().optional().describe('seconds (no events)'),
  length: z.number().positive().optional().describe('seconds of each voice (default: the envelope, or the rest of the sound)'),
  envelope: envelope.optional(),
  filters: z.array(filter).optional(),
  lfo: z.array(lfo).optional(),
  echo: echo.optional(),
  events: events.optional().describe('repeat this layer as separate voices over the sound'),
  seed: z.number().int().optional().describe('own seed (default: derived from the recipe seed and the layer position)'),
}).refine(l => (l.source ? 1 : 0) + (l.layers ? 1 : 0) === 1, { message: 'a layer has a source or layers, not both' }));

export const recipeSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  rate: z.union([z.literal(22050), z.literal(44100)]).optional().describe('sample rate (default 22050)'),
  duration: z.number().positive().max(120).describe('seconds'),
  seed: z.number().int().optional().describe('default 1'),
  loop: z.boolean().optional().describe('the end splices into the start (crossfade) and the WAV carries a loop point'),
  crossfade: z.number().positive().optional().describe('loop crossfade in seconds (default min(1, duration/4))'),
  gain_db: z.number().optional().describe('master gain (ignored with normalize)'),
  normalize: z.number().max(0).optional().describe('scale so the peak lands at this dBFS'),
  layers: z.array(layerSchema).min(1),
});

export type Recipe = z.infer<typeof recipeSchema>;
