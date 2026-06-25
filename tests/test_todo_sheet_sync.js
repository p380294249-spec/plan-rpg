const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const localStorageData = new Map();
const context = vm.createContext({
  console,
  Date,
  JSON,
  Math,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  structuredClone,
  localStorage: {
    getItem: key => localStorageData.get(key) || null,
    setItem: (key, value) => localStorageData.set(key, String(value))
  }
});

[
  "src/config/app-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/storage/local-cache.js",
  "src/storage/sheet-api.js",
  "src/services/task-service.js",
  "src/services/todo-service.js",
  "src/services/session-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  data = normalizeData({
    todos: [
      { id: "shared", category: "DFK", content: "本机旧状态", status: "pending", created_at: "2026-06-20T08:00:00.000Z", updated_at: "2026-06-20T08:00:00.000Z" },
      { id: "local-only", category: "INSO", content: "本机新增", status: "pending", created_at: "2026-06-21T08:00:00.000Z", updated_at: "2026-06-21T08:00:00.000Z" },
      { id: "local-newer", category: "OTHER", content: "本机更新更晚", status: "pending", created_at: "2026-06-22T08:00:00.000Z", updated_at: "2026-06-22T12:00:00.000Z" }
    ]
  });
  const merged = mergeRemoteTodos([
    { todo_id: "shared", category: "DFK", content: "云端已完成", is_starred: true, is_urgent: false, status: "done", created_at: "2026-06-20T08:00:00.000Z", completed_at: "2026-06-20T10:00:00.000Z", updated_at: "2026-06-20T10:00:00.000Z" },
    { todo_id: "remote-only", category: "INSO", content: "云端新增", is_starred: false, is_urgent: true, status: "pending", created_at: "2026-06-21T09:00:00.000Z", completed_at: "", updated_at: "2026-06-21T09:00:00.000Z" },
    { todo_id: "local-newer", category: "OTHER", content: "云端旧版本", is_starred: false, is_urgent: false, status: "pending", created_at: "2026-06-22T08:00:00.000Z", completed_at: "", updated_at: "2026-06-22T09:00:00.000Z" }
  ]);
  JSON.stringify({ todos: data.todos, uploads: merged.uploads.map(todo => todo.id), remoteCount: merged.remoteCount });
`, context));

const shared = result.todos.find(todo => todo.id === "shared");
const remoteOnly = result.todos.find(todo => todo.id === "remote-only");
const localNewer = result.todos.find(todo => todo.id === "local-newer");

assert.equal(result.remoteCount, 3);
assert.equal(shared.status, "done");
assert.equal(shared.content, "云端已完成");
assert.equal(shared.is_starred, true);
assert.equal(remoteOnly.category, "INSO");
assert.equal(remoteOnly.is_urgent, true);
assert.equal(localNewer.content, "本机更新更晚");
assert.deepEqual(result.uploads.sort(), ["local-newer", "local-only"]);

const migratedConfig = JSON.parse(vm.runInContext(`
  localStorage.setItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY, JSON.stringify({
    url: APP_CONFIG.LEGACY_GAS_URLS[0],
    token: "CHANGE_ME_PLAN_RPG_TOKEN"
  }));
  JSON.stringify(sheetSyncConfig());
`, context));
assert.equal(migratedConfig.url, "https://script.google.com/macros/s/AKfycbxdC5YaxjbtCFdgW5Viu19_LDZNm7wCBr7VxSqSOUWBloxROgLONp0GJ7omjinr9yarrw/exec");
assert.equal(migratedConfig.token, "plan-rpg-2026");

const fallbackCandidates = JSON.parse(vm.runInContext(`
  JSON.stringify(sheetSyncConfigCandidates({
    url: "https://script.google.com/macros/s/BROKEN/exec",
    token: "OLD_TOKEN"
  }));
`, context));
assert.equal(fallbackCandidates.length, 2);
assert.equal(fallbackCandidates[1].url, "https://script.google.com/macros/s/AKfycbxdC5YaxjbtCFdgW5Viu19_LDZNm7wCBr7VxSqSOUWBloxROgLONp0GJ7omjinr9yarrw/exec");
assert.equal(fallbackCandidates[1].token, "plan-rpg-2026");

const appsScript = fs.readFileSync(path.join(root, "google-apps-script/Code.gs"), "utf8");
assert.ok(appsScript.includes("get_todos"));
assert.ok(appsScript.includes("upsert_todo"));
assert.ok(appsScript.includes("upsertTodo_"));
assert.ok(appsScript.includes("parseRowParam_"));

const appsScriptManifest = JSON.parse(fs.readFileSync(path.join(root, "google-apps-script/appsscript.json"), "utf8"));
assert.equal(appsScriptManifest.webapp.executeAs, "USER_DEPLOYING");
assert.equal(appsScriptManifest.webapp.access, "ANYONE_ANONYMOUS");

console.log("Plan RPG todo cloud sync tests passed.");
