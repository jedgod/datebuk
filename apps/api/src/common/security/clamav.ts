import net from "net";

export type ClamScanResult = { ok: true } | { ok: false; reason: string };

export async function scanBufferWithClamAV(buf: Buffer): Promise<ClamScanResult> {
  const host = process.env.CLAMD_HOST || "localhost";
  const port = Number(process.env.CLAMD_PORT || "3310");

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write("zINSTREAM\0");
      const chunkSize = 1024 * 32;
      for (let offset = 0; offset < buf.length; offset += chunkSize) {
        const chunk = buf.subarray(offset, offset + chunkSize);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(chunk.length, 0);
        socket.write(size);
        socket.write(chunk);
      }
      const zero = Buffer.alloc(4);
      zero.writeUInt32BE(0, 0);
      socket.write(zero);
    });

    let data = "";
    socket.on("data", (d) => (data += d.toString("utf-8")));
    socket.on("error", () => resolve({ ok: false, reason: "ClamAV unavailable" })); // fail-closed
    socket.on("end", () => {
      // Typical: "stream: OK" or "stream: <virus> FOUND"
      if (/FOUND/i.test(data)) return resolve({ ok: false, reason: data.trim() });
      return resolve({ ok: true });
    });
  });
}
