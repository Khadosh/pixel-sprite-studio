// WAV in and out: PCM 16 bit mono. A loop point goes in a `smpl` chunk, the
// one game engines read (Godot imports it with loop mode "Detect From WAV").

import { readFileSync } from 'node:fs';

export interface Wav {
  rate: number;
  /** Mono samples in [-1, 1] (stereo files are mixed down). */
  samples: Float32Array;
  loop?: { start: number; end: number };
}

export function encodeWav(rate: number, samples: Float32Array, loop?: { start: number; end: number }): Buffer {
  const n = samples.length;
  const dataBytes = n * 2;
  const smplBytes = loop ? 8 + 36 + 24 : 0;
  const buf = Buffer.alloc(44 + dataBytes + (dataBytes % 2) + smplBytes);
  let o = 0;
  const str = (s: string) => { buf.write(s, o, 'ascii'); o += 4; };
  const u32 = (v: number) => { buf.writeUInt32LE(v >>> 0, o); o += 4; };
  const u16 = (v: number) => { buf.writeUInt16LE(v, o); o += 2; };
  str('RIFF'); u32(buf.length - 8); str('WAVE');
  str('fmt '); u32(16); u16(1); u16(1); u32(rate); u32(rate * 2); u16(2); u16(16);
  str('data'); u32(dataBytes);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), o);
    o += 2;
  }
  if (dataBytes % 2) o++;
  if (loop) {
    str('smpl'); u32(36 + 24);
    u32(0); u32(0); u32(Math.round(1e9 / rate)); u32(60); u32(0); u32(0); u32(0);
    u32(1); u32(0);
    u32(0); u32(0); u32(loop.start); u32(loop.end); u32(0); u32(0);
  }
  return buf;
}

export function decodeWav(buf: Buffer): Wav {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not a RIFF/WAVE file');
  }
  let o = 12;
  let rate = 0, channels = 1, bits = 16, format = 1;
  let data: Buffer | undefined;
  let loop: Wav['loop'];
  while (o + 8 <= buf.length) {
    const id = buf.toString('ascii', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    const body = o + 8;
    if (id === 'fmt ') {
      format = buf.readUInt16LE(body);
      channels = buf.readUInt16LE(body + 2);
      rate = buf.readUInt32LE(body + 4);
      bits = buf.readUInt16LE(body + 14);
    } else if (id === 'data') {
      data = buf.subarray(body, Math.min(buf.length, body + size));
    } else if (id === 'smpl' && size >= 36) {
      const loops = buf.readUInt32LE(body + 28);
      if (loops > 0 && size >= 60) loop = { start: buf.readUInt32LE(body + 44), end: buf.readUInt32LE(body + 48) };
    }
    o = body + size + (size % 2);
  }
  if (!data || !rate) throw new Error('WAV without fmt or data');
  if (format !== 1 || bits !== 16) throw new Error(`only PCM 16 bit is supported (format ${format}, ${bits} bit)`);
  const frames = Math.floor(data.length / (2 * channels));
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < channels; c++) s += data.readInt16LE((i * channels + c) * 2);
    samples[i] = s / channels / 32767;
  }
  return { rate, samples, loop };
}

export function readWav(path: string): Wav {
  return decodeWav(readFileSync(path));
}
