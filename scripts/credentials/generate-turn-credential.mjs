import { createHmac } from "node:crypto";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));
if (!args.secret || !args.user) {
  console.error("Usage: node generate-turn-credential.mjs --secret <secret> --user <id> [--ttl 600]");
  process.exit(1);
}
const ttl = Number(args.ttl || 600);
const expiresAt = Math.floor(Date.now() / 1000) + ttl;
const username = `${expiresAt}:${args.user}`;
const credential = createHmac("sha1", args.secret).update(username).digest("base64");
console.log(JSON.stringify({ username, credential, expiresAt }));
