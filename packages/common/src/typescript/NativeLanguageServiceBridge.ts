import * as path from "node:path";
import { Worker } from "node:worker_threads";
import { getNativeLibDirectory } from "./getNativeLibDirectory";

// Standard LSP runs asynchronously in a worker. Only serializable edits and
// locations cross this boundary; compiler nodes and checker objects never do.
const workerSource = String.raw`
const { parentPort, workerData } = require("node:worker_threads");
const { spawn } = require("node:child_process");
const control = new Int32Array(workerData.buffer, 0, 4);
const output = new Uint8Array(workerData.buffer, 16);
let sequence = 0, incoming = Buffer.alloc(0), failed, settings = {};
const pending = new Map();
const child = spawn(workerData.executable, ["--lsp", "--stdio"], { stdio: ["pipe", "pipe", "pipe"] });
Atomics.store(control, 3, child.pid || 0);
child.stderr.resume();
function send(message) {
  const body = Buffer.from(JSON.stringify(message));
  child.stdin.write("Content-Length: " + body.length + "\r\n\r\n");
  child.stdin.write(body);
}
function notify(method, params) {
  if (method === "workspace/didChangeConfiguration") settings = params.settings || {};
  send({ jsonrpc: "2.0", method, ...(params === undefined ? {} : { params }) });
}
function request(method, params) {
  if (failed) return Promise.reject(failed);
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) });
  });
}
function fail(error) {
  failed = error;
  for (const operation of pending.values()) operation.reject(error);
  pending.clear();
}
child.on("error", fail);
child.on("exit", (code, signal) => {
  Atomics.store(control, 3, 0);
  fail(new Error("Native language server exited: " + (signal || code)));
});
child.stdin.on("error", fail);
child.stdout.on("data", chunk => {
  incoming = Buffer.concat([incoming, chunk]);
  while (true) {
    const boundary = incoming.indexOf("\r\n\r\n");
    if (boundary < 0) return;
    const match = /Content-Length:\s*(\d+)/i.exec(incoming.subarray(0, boundary).toString());
    if (!match) return fail(new Error("Invalid language server response framing."));
    const length = Number(match[1]);
    if (incoming.length < boundary + 4 + length) return;
    let message;
    try { message = JSON.parse(incoming.subarray(boundary + 4, boundary + 4 + length).toString()); }
    catch (error) { return fail(error); }
    incoming = incoming.subarray(boundary + 4 + length);
    if (message.method && message.id !== undefined) {
      const result = message.method === "workspace/configuration"
        ? message.params.items.map(item => settings[item.section] || {}) : null;
      send({ jsonrpc: "2.0", id: message.id, result });
    } else if (message.id !== undefined) {
      const operation = pending.get(message.id);
      if (!operation) continue;
      pending.delete(message.id);
      if (message.error) operation.reject(new Error(message.error.message));
      else operation.resolve(message.result);
    }
  }
});
function respond(value, error) {
  let bytes = Buffer.from(JSON.stringify(error ? { message: String(value) } : (value === undefined ? null : value)));
  if (bytes.length > output.length) {
    bytes = Buffer.from(JSON.stringify({ message: "Language server response exceeded the shared buffer capacity." }));
    error = true;
  }
  output.set(bytes);
  Atomics.store(control, 1, bytes.length);
  Atomics.store(control, 0, error ? 2 : 1);
  Atomics.notify(control, 0);
}
const ready = request("initialize", {
  processId: workerData.processId,
  rootUri: null,
  capabilities: {
    general: { positionEncodings: ["utf-16"] },
    workspace: { configuration: true },
    textDocument: { definition: { linkSupport: true }, codeAction: { codeActionLiteralSupport: { codeActionKind: { valueSet: ["quickfix", "source.organizeImports.ts"] } } } }
  }
}).then(() => notify("initialized", {}));
ready.catch(() => {});
parentPort.on("message", async operation => {
  try {
    await ready;
    for (const message of operation.notifications || []) notify(message.method, message.params);
    if (operation.dispose) {
      try { await request("shutdown"); } finally { notify("exit"); child.kill(); }
      respond(null);
      parentPort.close();
    } else respond(await request(operation.method, operation.params));
  } catch (error) {
    respond(error.message, true);
    if (operation.dispose) { child.kill(); parentPort.close(); }
  }
});
`;

/** @internal */
export interface LanguageServerNotification {
  method: string;
  params: unknown;
}

/** @internal */
export class NativeLanguageServiceBridge {
  #buffer!: SharedArrayBuffer;
  #control!: Int32Array;
  #worker: Worker | undefined;
  #disposed = false;
  #failed = false;

  request<T>(method: string, params: unknown, notifications: LanguageServerNotification[] = []): T {
    if (this.#disposed || this.#failed)
      throw new Error("The native language service has been disposed or has failed.");
    if (this.#worker == null) {
      this.#buffer = new SharedArrayBuffer(16 + 32 * 1024 * 1024);
      this.#control = new Int32Array(this.#buffer, 0, 4);
      this.#worker = new Worker(workerSource, {
        eval: true,
        workerData: {
          buffer: this.#buffer,
          processId: process.pid,
          executable: path.join(getNativeLibDirectory(), process.platform === "win32" ? "tsc.exe" : "tsc"),
        },
      });
      this.#worker.on("error", () => {
        this.#failed = true;
      });
    }
    return this.#call({ method, params, notifications });
  }

  #call<T>(message: unknown): T {
    Atomics.store(this.#control, 0, 0);
    this.#worker!.postMessage(message);
    if (Atomics.wait(this.#control, 0, 0, 60_000) === "timed-out") {
      this.#failed = true;
      this.#kill();
      throw new Error("The native language server did not respond within 60 seconds.");
    }
    const text = Buffer.from(this.#buffer, 16, Atomics.load(this.#control, 1)).toString("utf8");
    const result = JSON.parse(text);
    if (Atomics.load(this.#control, 0) === 2)
      throw new Error(result.message);
    return result;
  }

  #kill() {
    if (this.#control == null)
      return;
    const pid = Atomics.exchange(this.#control, 3, 0);
    if (pid !== 0) {
      try {
        process.kill(pid);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH")
          throw error;
      }
    }
    void this.#worker?.terminate();
    this.#worker = undefined;
  }

  dispose() {
    if (this.#disposed)
      return;
    this.#disposed = true;
    try {
      if (this.#worker != null && !this.#failed)
        this.#call({ dispose: true });
    } finally {
      this.#kill();
    }
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
