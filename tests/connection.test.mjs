import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("polling forwards firmware state, recovers after failure, and ignores late results after disconnect", async () => {
  const timers = [];
  const calls = [];
  const payload = { calibrated: true, calibrating: false, elapsed_ms: 0, duration_ms: 20000,
    samples: 0, seat: 542.39, back: -384.02, neck: 37.4, ref_seat: 619.1,
    ref_back: 1234.1, ref_neck: 2359.1, occupied: true, good: false,
    state: 3, ble_connected: true, message: "Stored calibration loaded" };
  let fail = false, pending;
  const source = fs.readFileSync(new URL("../src/services/deviceConnection.ts", import.meta.url), "utf8")
    .replace(/^import .*$/gm, "").replace("export const deviceConnection", "const deviceConnection");
  const js = ts.transpile(source + "\nglobalThis.connection = deviceConnection;", { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
  const context = { console: { warn() {} }, Date,
    parseDeviceMessage: x => x,
    window: { setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {} },
    invoke: async (name, args) => {
      calls.push([name, args]);
      if (pending) return await pending;
      if (fail) throw new Error("offline");
      return name === "sitwell_status" ? payload : undefined;
    }};
  vm.runInNewContext(js, context);
  const c = context.connection, messages = [], firmware = [];
  const flush = () => new Promise(resolve => setImmediate(resolve));
  c.onMessage(m => messages.push(m)); c.onFirmware(d => firmware.push(d));
  c.connect(); await flush();
  assert.equal(c.getLinkState(), "connected");
  assert.equal(messages[0].lampConnected, true);
  assert.equal(messages[1].firmwareState, 3);
  assert.equal(firmware[0].back, -384.02);
  fail = true; await timers.shift()(); await flush();
  assert.equal(c.getLinkState(), "disconnected");
  fail = false; await timers.shift()(); await flush();
  assert.equal(c.getLinkState(), "connected");
  await c.calibrate(); await c.calibrate(true);
  assert.deepEqual(calls.slice(-2).map(x => [x[0], x[1].cancel]), [["sitwell_calibrate", false], ["sitwell_calibrate", true]]);
  let finish;
  pending = new Promise(resolve => { finish = resolve; });
  const inFlight = timers.shift()();
  c.disconnect(); finish(payload); await inFlight;
  assert.equal(c.getLinkState(), "disconnected");
  assert.equal(c.latestFirmware, null);
  assert.equal(timers.length, 0);
});
