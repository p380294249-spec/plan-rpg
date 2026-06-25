// src/ui/render-todos.js
// Render-only layer for the minimal DFK / INSO / OTHER todo experience.

function renderTodos() {
  renderTodoInputControls();
  renderTodoGroups();
  renderCompletedTodoHistory();
}

function renderTodoInputControls() {
  document.querySelectorAll("[data-todo-input-category]").forEach(button => {
    const active = button.dataset.todoInputCategory === todoUiState.category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.onclick = () => setTodoInputCategory(button.dataset.todoInputCategory);
  });
  bindTodoToggle("todoStarButton", todoUiState.isStarred, () => toggleTodoInputFlag("isStarred"), true);
  bindTodoToggle("todoUrgentButton", todoUiState.isUrgent, () => toggleTodoInputFlag("isUrgent"));
  $("addTodoBtn").onclick = addSimpleTodo;
  $("todoContent").onkeydown = event => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    addSimpleTodo();
  };
  document.querySelectorAll("[data-todo-filter]").forEach(button => {
    const active = button.dataset.todoFilter === todoUiState.filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.onclick = () => setTodoFilter(button.dataset.todoFilter);
  });
  if ($("syncTodosBtn")) $("syncTodosBtn").onclick = () => refreshTodosFromCloud({ silent: false });
}

function bindTodoToggle(id, active, onClick, hasStarIcon = false) {
  const button = $(id);
  button.classList.toggle("active", active);
  button.setAttribute("aria-pressed", String(active));
  if (hasStarIcon) button.querySelector("[data-toggle-icon]").textContent = active ? "★" : "☆";
  button.onclick = onClick;
}

function renderTodoGroups() {
  const groups = todoPendingGroups();
  $("todoGroups").innerHTML = groups
    .filter(group => group.todos.length)
    .map(group => `
      <section class="todo-group todo-group-${group.id}">
        <h4>${group.title}</h4>
        <div class="todo-items">${group.todos.map(todoItemHtml).join("")}</div>
      </section>
    `).join("") || `<div class="todo-empty">没有待办</div>`;
  document.querySelectorAll("[data-todo-complete]").forEach(input => {
    input.onchange = () => completeSimpleTodo(input.dataset.todoComplete);
  });
}

function todoItemHtml(todo) {
  return `
    <div class="todo-item">
      <input class="todo-check" type="checkbox" data-todo-complete="${escapeHtml(todo.id)}" aria-label="完成：${escapeHtml(todo.content)}" />
      <span class="todo-content">${escapeHtml(todo.content)}</span>
      <span class="todo-category category-${todo.category.toLowerCase()}">${todoCategoryLabel(todo.category)}</span>
      ${todo.is_starred ? `<span class="todo-star" title="重要">★</span>` : ""}
      ${todo.is_urgent ? `<span class="todo-urgent">紧急</span>` : ""}
    </div>
  `;
}

function renderCompletedTodoHistory() {
  const todos = completedTodos();
  $("completedTodoList").innerHTML = todos.length
    ? todos.map(todo => `
      <div class="completed-todo">
        <span>${escapeHtml(todo.content)}</span>
        <span class="todo-category category-${todo.category.toLowerCase()}">${todoCategoryLabel(todo.category)}</span>
        <small>${todoShortDate(todo.completed_at)}</small>
      </div>
    `).join("")
    : `<div class="todo-empty">暂无完成记录</div>`;
}
