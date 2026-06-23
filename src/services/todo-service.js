// src/services/todo-service.js
// Minimal personal todo logic: capture, prioritize, complete, and retain history.

const TODO_CATEGORIES = ["DFK", "INSO", "OTHER"];
const TODO_GROUPS = [
  { id: "urgent-starred", title: "紧急 + 重要", matches: todo => todo.is_urgent && todo.is_starred },
  { id: "urgent", title: "紧急", matches: todo => todo.is_urgent && !todo.is_starred },
  { id: "starred", title: "重要", matches: todo => !todo.is_urgent && todo.is_starred },
  { id: "normal", title: "普通待办", matches: todo => !todo.is_urgent && !todo.is_starred }
];

function todoCategoryLabel(category) {
  return TODO_CATEGORIES.includes(category) ? category : "OTHER";
}

function todoPendingGroups() {
  const pending = data.todos
    .filter(todo => todo.status === "pending")
    .filter(todo => todoUiState.filter === "ALL" || todo.category === todoUiState.filter)
    .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
  return TODO_GROUPS.map(group => ({ ...group, todos: pending.filter(group.matches) }));
}

function completedTodos() {
  return data.todos
    .filter(todo => todo.status === "done")
    .sort((left, right) => String(right.completed_at || "").localeCompare(String(left.completed_at || "")));
}

function setTodoInputCategory(category) {
  if (!TODO_CATEGORIES.includes(category)) return;
  todoUiState.category = category;
  saveTodoUiState(todoUiState);
  renderTodos();
}

function toggleTodoInputFlag(flag) {
  if (!["isStarred", "isUrgent"].includes(flag)) return;
  todoUiState[flag] = !todoUiState[flag];
  saveTodoUiState(todoUiState);
  renderTodos();
}

function setTodoFilter(category) {
  if (!["ALL", ...TODO_CATEGORIES].includes(category)) return;
  todoUiState.filter = category;
  saveTodoUiState(todoUiState);
  renderTodos();
}

function addSimpleTodo() {
  const content = $("todoContent").value.trim();
  if (!content) {
    $("todoContent").focus();
    return;
  }
  const now = new Date().toISOString();
  data.todos.unshift({
    id: newId("TODO"),
    category: todoUiState.category,
    content,
    is_starred: Boolean(todoUiState.isStarred),
    is_urgent: Boolean(todoUiState.isUrgent),
    status: "pending",
    created_at: now,
    completed_at: "",
    updated_at: now
  });
  $("todoContent").value = "";
  save();
  renderTodos();
  $("todoContent").focus();
}

function completeSimpleTodo(todoId) {
  const todo = data.todos.find(item => item.id === todoId);
  if (!todo || todo.status !== "pending") return;
  const now = new Date().toISOString();
  todo.status = "done";
  todo.completed_at = now;
  todo.updated_at = now;
  save();
  renderTodos();
}

function todoShortDate(value) {
  return String(value || "").slice(0, 10);
}
