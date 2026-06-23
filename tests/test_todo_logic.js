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

const result = vm.runInContext(`
  data = normalizeData({
    todos: [
      { id: "old-urgent", title: "DFK 财务对账", priority: "urgent", status: "open", createdAt: "2026-06-20T10:00:00.000Z" },
      { id: "old-important", title: "INSO 客户报价", priority: "high", status: "open", questId: "Q-011", createdAt: "2026-06-21T10:00:00.000Z" },
      { id: "old-done", title: "旧的普通事项", status: "done", createdAt: "2026-06-19T10:00:00.000Z" }
    ]
  });
  todoUiState = { category: "DFK", filter: "ALL", isStarred: false, isUrgent: false };
  JSON.stringify({ todos: data.todos, groups: todoPendingGroups(), completed: completedTodos() });
`, context);
const payload = JSON.parse(result);

const urgent = payload.todos.find(todo => todo.id === "old-urgent");
const important = payload.todos.find(todo => todo.id === "old-important");
const done = payload.todos.find(todo => todo.id === "old-done");

assert.deepEqual(Object.keys(urgent).sort(), ["category", "completed_at", "content", "created_at", "id", "is_starred", "is_urgent", "status", "updated_at"]);
assert.equal(urgent.category, "DFK");
assert.equal(urgent.is_urgent, true);
assert.equal(urgent.is_starred, true);
assert.equal(urgent.status, "pending");
assert.equal(important.category, "INSO");
assert.equal(important.is_starred, true);
assert.equal(important.is_urgent, false);
assert.equal(done.status, "done");
assert.ok(done.completed_at);
assert.equal(payload.groups[0].todos[0].id, "old-urgent");
assert.equal(payload.groups[2].todos[0].id, "old-important");
assert.equal(payload.completed[0].id, "old-done");

const addResult = vm.runInContext(`
  const todoInput = { value: "发送 INSO 报价", focus: () => {} };
  globalThis.document = { getElementById: id => id === "todoContent" ? todoInput : null };
  function renderTodos() {}
  todoUiState = { category: "INSO", filter: "ALL", isStarred: true, isUrgent: true };
  addSimpleTodo();
  JSON.stringify({ todo: data.todos[0], state: todoUiState });
`, context);
const added = JSON.parse(addResult);
assert.equal(added.todo.category, "INSO");
assert.equal(added.todo.is_starred, true);
assert.equal(added.todo.is_urgent, true);
assert.equal(added.state.category, "INSO");
assert.equal(added.state.isStarred, false);
assert.equal(added.state.isUrgent, false);

const todoRenderer = fs.readFileSync(path.join(root, "src/ui/render-todos.js"), "utf8");
assert.ok(todoRenderer.includes('<div class="todo-item">'));
assert.ok(!todoRenderer.includes('<label class="todo-item">'));

console.log("Plan RPG todo migration and priority tests passed.");
