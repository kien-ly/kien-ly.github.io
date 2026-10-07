import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const source = resolve(root, '.idea/pj/sap-c02.md');
const passwordFile = resolve(root, '.idea/pj/sap-c02-password.txt');
if (args.some(arg => !['--generate-password'].includes(arg))) {
  throw new Error('Usage: node scripts/build-sap-quiz.mjs [--generate-password]');
}
let password = process.env.SAP_QUIZ_PASSWORD;
if (!password && args.includes('--generate-password')) {
  // Never overwrite an existing password without an explicit local edit.
  password = randomBytes(24).toString('base64url');
  writeFileSync(passwordFile, password + '\n', { flag: 'wx', mode: 0o600 });
}
if (!password) password = readFileSync(passwordFile, 'utf8').trim();
if (password.length < 16) throw new Error('Use a password with at least 16 characters.');
const markdown = readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
const sections = [...markdown.matchAll(/^## question (\d+)\s*\n([\s\S]*?)(?=^## question \d+\s*$|(?![\s\S]))/gm)];
const questions = sections.map(([, id, section]) => {
  const key = section.match(/^\*\*Answer:\s*([A-H ,]+)\*\*\s*$/m);
  if (!key) throw new Error(`Missing answer for question ${id}`);
  const answer = [...new Set(key[1].match(/[A-H]/g))].sort();
  const clean = section.replace(/^Suggested Answer:.*\n?/gm, '').replace(/^\*\*Answer:.*\n?/gm, '').trim();
  const options = [...clean.matchAll(/^([A-H])\.\s+([\s\S]*?)(?=^[A-H]\.\s+|(?![\s\S]))/gm)].map(([, letter, text]) => ({ letter, text: text.trim() }));
  const prompt = clean.slice(0, clean.search(/^[A-H]\.\s+/m)).trim();
  const declared = prompt.match(/Choose\s+(two|three|four|five|six|\d+)/i);
  const counts = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  const required = declared ? (counts[declared[1].toLowerCase()] || Number(declared[1])) : answer.length;
  if (!prompt || options.length < 2 || answer.some(letter => !options.some(o => o.letter === letter))) throw new Error(`Invalid question ${id}`);
  if (new Set(options.map(o => o.letter)).size !== options.length) throw new Error(`Duplicate option for question ${id}`);
  const incomplete = required !== answer.length || options.some(o => /(?:following|below):\s*$/i.test(o.text));
  return { id: Number(id), prompt, options, answer, required, incomplete };
});
if (!questions.length || new Set(questions.map(q => q.id)).size !== questions.length) throw new Error('Invalid question IDs');
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600000;
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(Buffer.from('sap-c02-quiz:v1'));
const payload = Buffer.from(JSON.stringify({ version: 1, questions }));
const encrypted = Buffer.concat([cipher.update(payload), cipher.final(), cipher.getAuthTag()]);
const envelope = { version: 1, iterations, salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: encrypted.toString('base64') };
const destination = resolve(root, 'static/sap-c02-dump/questions.enc.json');
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination + '.tmp', JSON.stringify(envelope) + '\n');
renameSync(destination + '.tmp', destination);
console.log(`Encrypted ${questions.length} questions. ${questions.filter(q => q.incomplete).length} incomplete source entries will not be graded.`);
console.log('Password stays in the ignored .idea/pj/sap-c02-password.txt file or the supplied environment variable.');
