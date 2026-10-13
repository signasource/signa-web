import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";

const dir = "certificates";
const key = `${dir}/lan-key.pem`;
const cert = `${dir}/lan-cert.pem`;
const stamp = `${dir}/lan-hosts.txt`;

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);
const hosts = ["DNS:localhost", "IP:127.0.0.1", ...ips.map((ip) => `IP:${ip}`)].join(",");

if (existsSync(cert) && existsSync(stamp) && readFileSync(stamp, "utf8") === hosts) process.exit(0);

mkdirSync(dir, { recursive: true });
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "365",
    "-keyout",
    key,
    "-out",
    cert,
    "-subj",
    "/CN=signa-dev",
    "-addext",
    `subjectAltName=${hosts}`,
  ],
  { stdio: "ignore" },
);
writeFileSync(stamp, hosts);
console.log(`Certificado de desarrollo para ${ips.join(", ") || "localhost"}`);
