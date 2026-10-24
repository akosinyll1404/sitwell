import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, names, context) {
  const source = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8")
    .replace(/^import .*$/gm, "").replace(/^export /gm, "");
  const code = ts.transpile(source + "\nObject.assign(globalThis, {" + names.join(",") + "});",
    { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
  vm.runInNewContext(code, context);
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));
const defaults = {postureAlerts:true,breakReminders:true,alertActivation:true,alertRepetition:false,
  alertDelaySeconds:30,breakIntervalMinutes:30,feedbackType:"both"};

test("settings migrate from localStorage only when SQLite has no saved settings", async () => {
  const calls = [];
  let stored = null;
  const context = load("src/services/settingsRepository.ts", ["settingsRepository"], {
    DEFAULT_SETTINGS:defaults, hasDesktopStorage:() => true,
    window:{localStorage:{getItem:() => JSON.stringify({...defaults,breakIntervalMinutes:45})}},
    storageInvoke:async (command,args) => {
      calls.push(command);
      if (command === "settings_load") return stored;
      stored = plain(args.settings);
    },
  });
  const repository = context.settingsRepository;
  assert.equal((await repository.load()).breakIntervalMinutes,45);
  assert.deepEqual(calls,["settings_load","settings_save"]);
  calls.length = 0;
  stored = {...defaults,breakIntervalMinutes:90};
  assert.equal((await repository.load()).breakIntervalMinutes,90);
  assert.deepEqual(calls,["settings_load"]);
});

test("rapid setting changes are serialized, and failed writes remain retryable", async () => {
  const completed = [];
  let fail = true;
  const context = load("src/services/settingsRepository.ts", ["settingsRepository"], {
    DEFAULT_SETTINGS:defaults,hasDesktopStorage:() => true,window:{},
    storageInvoke:async (_command,args) => {
      if (fail) { fail = false; throw new Error("disk full"); }
      completed.push(args.settings.breakIntervalMinutes);
    },
  });
  const repo = context.settingsRepository;
  await assert.rejects(repo.save({...defaults,breakIntervalMinutes:15}),/disk full/);
  await Promise.all([repo.save({...defaults,breakIntervalMinutes:45}),repo.save({...defaults,breakIntervalMinutes:60})]);
  assert.deepEqual(completed,[45,60]);
});

test("history queries use local day boundaries and do not synthesize unsaved data", async () => {
  const calls = [];
  const addDays = (day,n) => { const d = new Date(day); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d.getTime(); };
  const context = load("src/services/historyRepository.ts",["historyRepository"],{
    addDays,
    storageInvoke:async (command,args) => {
      calls.push([command,plain(args)]);
      if (command === "history_sessions") return {sessions:[],total:0};
      return args.ranges.map(r => ({start:r.start,goodMs:0,slouchMs:0,poorMs:0,deviations:0,breaksTaken:0}));
    },
  });
  const repo = context.historyRepository;
  const day = new Date(2026,9,23).setHours(0,0,0,0);
  const rows = await repo.getTimeline(day);
  assert.equal(rows.length,(addDays(day,1)-day)/1800000);
  assert.equal(rows.reduce((sum,r) => sum+r.goodMs,0),0);
  const days = await repo.getDailyTotals(day,addDays(day,6));
  assert.equal(days.length,7);
  assert.equal(calls[1][1].ranges.at(-1).end,addDays(day,7));
  await repo.listSessions({limit:5,offset:10});
  assert.deepEqual(calls[2],["history_sessions",{limit:5,offset:10}]);
});
