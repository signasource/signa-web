export interface LayerShape {
  in: number;
  out: number;
  relu: boolean;
}

export interface ClassifierManifest {
  model: string;
  labels: string[];
  thresholds: Record<string, number>;
  featureDim: number;
  faceDim: number;
  nets: LayerShape[][];
}

interface Layer extends LayerShape {
  weights: Float32Array;
  bias: Float32Array;
}

export interface AlphabetClassifier {
  manifest: ClassifierManifest;
  predict(hand: ArrayLike<number>, face: ArrayLike<number>): Float32Array;
}

export function createClassifier(
  manifest: ClassifierManifest,
  weights: ArrayBuffer,
): AlphabetClassifier {
  const data = new Float32Array(weights);
  let offset = 0;
  const take = (n: number) => {
    const view = data.subarray(offset, offset + n);
    if (view.length !== n) throw new Error("Los pesos del abecedario están incompletos");
    offset += n;
    return view;
  };
  const nets: Layer[][] = manifest.nets.map((shapes) =>
    shapes.map((s) => ({ ...s, weights: take(s.in * s.out), bias: take(s.out) })),
  );
  if (offset !== data.length) throw new Error("Los pesos del abecedario no coinciden con su forma");

  const inputSize = manifest.featureDim + manifest.faceDim;

  return {
    manifest,
    predict(hand, face) {
      const input = new Float64Array(inputSize);
      for (let i = 0; i < manifest.featureDim; i++) input[i] = hand[i] ?? 0;
      for (let i = 0; i < manifest.faceDim; i++) input[manifest.featureDim + i] = face[i] ?? 0;

      const out = new Float32Array(manifest.labels.length);
      for (const layers of nets) {
        let h: Float64Array = input;
        for (const layer of layers) {
          const next = Float64Array.from(layer.bias);
          for (let i = 0; i < layer.in; i++) {
            const v = h[i]!;
            if (v === 0) continue;
            const row = i * layer.out;
            for (let j = 0; j < layer.out; j++) next[j]! += v * layer.weights[row + j]!;
          }
          if (layer.relu) for (let j = 0; j < next.length; j++) if (next[j]! < 0) next[j] = 0;
          h = next;
        }
        let max = -Infinity;
        for (const v of h) max = Math.max(max, v);
        let sum = 0;
        const e = h.map((v) => Math.exp(v - max));
        for (const v of e) sum += v;
        for (let j = 0; j < out.length; j++) out[j]! += e[j]! / sum / nets.length;
      }
      return out;
    },
  };
}
