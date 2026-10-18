import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";
export function createVault(directory) {
  let memory = {};
  function master() {
    const path = join(directory, ".vault-key");
    if (!existsSync(path))
      writeFileSync(path, randomBytes(32), { mode: 0o600, flag: "wx" });
    return readFileSync(path);
  }
  function read() {
    if (!directory) return memory;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const path = join(directory, "secrets.enc");
    if (!existsSync(path)) return {};
    const data = JSON.parse(readFileSync(path, "utf8"));
    const decipher = createDecipheriv(
      "aes-256-gcm",
      master(),
      Buffer.from(data.iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(data.tag, "hex"));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(data.body, "hex")),
        decipher.final(),
      ]).toString(),
    );
  }
  function save(values) {
    if (!directory) {
      memory = values;
      return;
    }
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", master(), iv);
    const body = Buffer.concat([
      cipher.update(JSON.stringify(values)),
      cipher.final(),
    ]);
    const path = join(directory, "secrets.enc");
    writeFileSync(
      path + ".tmp",
      JSON.stringify({
        iv: iv.toString("hex"),
        tag: cipher.getAuthTag().toString("hex"),
        body: body.toString("hex"),
      }),
      { mode: 0o600 },
    );
    renameSync(path + ".tmp", path);
  }
  return {
    get: (provider) => read()[provider] || null,
    set: (provider, key) => {
      const values = read();
      if (key) values[provider] = key;
      else delete values[provider];
      save(values);
    },
  };
}
