// Assembles the Kokoro-82M (Apache-2.0) voice model for offline use.
// Weights come from the kokoro-q8-shards npm package (byte-identical to onnx-community/Kokoro-82M-v1.0-ONNX model_quantized.onnx).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
export const MODEL_ROOT = path.join(ROOT, 'models');
export const MODEL_ID = 'kokoro';
const DIR = path.join(MODEL_ROOT, MODEL_ID);
const SHA = 'fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478';

export function ensureKokoro() {
  const onnx = path.join(DIR, 'onnx', 'model_quantized.onnx');
  if (existsSync(onnx) && existsSync(path.join(DIR, 'config.json'))) return true;
  const shardDir = path.join(ROOT, 'node_modules', 'kokoro-q8-shards');
  if (!existsSync(shardDir)) return false;
  mkdirSync(path.dirname(onnx), { recursive: true });
  const buf = Buffer.concat([0, 1, 2, 3, 4, 5].map((i) => readFileSync(path.join(shardDir, `kokoro-q8.part${i}.bin`))));
  const got = createHash('sha256').update(buf).digest('hex');
  if (got !== SHA) throw new Error(`Kokoro model checksum mismatch (${got}). Refusing to use it.`);
  writeFileSync(onnx, buf);
  writeFileSync(path.join(DIR, 'config.json'), JSON.stringify({ model_type: 'style_text_to_speech_2', architectures: ['StyleTextToSpeech2Model'] }, null, 2));
  const tok = JSON.parse(readFileSync(path.join(HERE, 'kokoro', 'tokenizer.json'), 'utf8'));
  copyFileSync(path.join(HERE, 'kokoro', 'tokenizer.json'), path.join(DIR, 'tokenizer.json'));
  writeFileSync(path.join(DIR, 'tokenizer_config.json'), JSON.stringify(tok.config || { tokenizer_class: 'PreTrainedTokenizer' }, null, 2));
  console.log('Kokoro model assembled (checksum OK).');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(ensureKokoro() ? 'ready' : 'kokoro-q8-shards not installed: npm install');
