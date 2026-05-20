// src/ui/render-todos.js
// Extracted from index.html during the safe modular refactor.

function renderTodos() {
  populateTodoGoalSelect($("todoGoal").value || "BUSINESS");
  populateTodoQuestSelect($("todoGoal").value || "BUSINESS", $("todoQuest").value || "Q-001");
  if (!$("todoDueDate").value) $("todoDueDate").value = todayISO();
  const openTodos = data.todos.filter(todo => todo.status !== "done" && todo.status !== "deleted");
  const today = openTodos.filter(todo => todo.dueDate <= todayISO());
  const later = openTodos.filter(todo => todo.dueDate > todayISO());
  $("todayTodoList").innerHTML = today.map(todoCard).join("") || `<p>今天没有提醒。可以先把事情丢进待办收件箱。</p>`;
  $("laterTodoList").innerHTML = later.map(todoCard).join("") || `<p>晚点做列表为空。</p>`;
  document.querySelectorAll("[data-todo-start]").forEach(btn => btn.onclick = () => startTodo(btn.dataset.todoStart));
  document.querySelectorAll("[data-todo-done]").forEach(btn => btn.onclick = () => finishTodo(btn.dataset.todoDone));
  document.querySelectorAll("[data-todo-later]").forEach(btn => btn.onclick = () => moveTodoLater(btn.dataset.todoLater));
  document.querySelectorAll("[data-todo-delete]").forEach(btn => btn.onclick = () => deleteTodo(btn.dataset.todoDelete));
}

function todoCard(todo) {
  const quest = questById(todo.questId);
  const goal = data.goals2030.find(item => item.id === goalIdForQuestId(todo.questId));
  return `
    <div class="log-card">
      <div class="row"><span class="pill">${escapeHtml(todo.dueDate)} · ${escapeHtml(todo.priority)} · ${todo.gmn}</span><small>${escapeHtml(goalLabel(goal))} / ${escapeHtml(questPathLabel(todo.questId) || quest?.name || todo.questId)}</small></div>
      <p><b>${escapeHtml(todo.title)}</b></p>
      ${todo.note ? `<p>${escapeHtml(todo.note)}</p>` : ""}
      <div class="log-actions">
        <button class="primary" data-todo-start="${todo.id}">开始20分钟</button>
        <button class="secondary" data-todo-later="${todo.id}">明天提醒</button>
        <button class="secondary" data-todo-done="${todo.id}">完成</button>
        <button class="danger" data-todo-delete="${todo.id}">删除</button>
      </div>
    </div>
  `;
}
