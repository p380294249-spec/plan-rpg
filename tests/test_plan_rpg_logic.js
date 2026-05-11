const assert = require("assert");

function newId(prefix) {
  return `${prefix}-test`;
}

function questIdForType(type, goalId = "") {
  if (type === "main") {
    if (goalId === "PASSIVE") return "Q-002";
    if (goalId === "BUSINESS") return "Q-003";
    return "Q-001";
  }
  if (type === "maintenance") return "Q-005";
  if (type === "noise") return "Q-008";
  return "Q-009";
}

function createRandomEvent({ title, questType, gmn, reason, goalId = "" }) {
  return {
    id: newId("T-RND"),
    questId: questIdForType(questType, goalId),
    name: title,
    current_title: title,
    gmn,
    is_random_event: true,
    quest_type: questType,
    reason,
    pivot_status: "none"
  };
}

function questTypeForTask(task) {
  if (task.is_random_event && !["Promoted", "Filed as Maintenance", "Filed as Noise"].includes(task.status)) return "emergency";
  if (task.pivot_status && task.pivot_status !== "none") return "pivot";
  return task.quest_type || "side";
}

function pivotTask(originalTask, type, newTitle, reason) {
  const originalTitle = originalTask.original_title || originalTask.name;
  if (type === "renamed") {
    return {
      tasks: [{
        ...originalTask,
        name: newTitle,
        current_title: newTitle,
        original_title: originalTitle,
        pivot_status: "renamed",
        pivot_reason: reason
      }],
      log: {
        is_pivoted: true,
        original_task_id: originalTask.id,
        actual_task_id: originalTask.id,
        pivot_note: `Rename Task：${reason}`
      }
    };
  }
  const generated = {
    ...originalTask,
    id: newId("T-PVT"),
    name: newTitle,
    current_title: newTitle,
    original_title: newTitle,
    pivot_status: "none"
  };
  return {
    tasks: [{
      ...originalTask,
      original_title: originalTitle,
      pivot_status: type,
      pivot_reason: reason,
      generated_task_id: generated.id,
      status: type === "paused_for_new_task" ? "Paused" : "Discovery"
    }, generated],
    log: {
      is_pivoted: true,
      original_task_id: originalTask.id,
      actual_task_id: generated.id,
      pivot_note: `${type}：${reason}`
    }
  };
}

const random = createRandomEvent({
  title: "紧急处理银行回款",
  questType: "main",
  gmn: "G",
  reason: "影响现金流",
  goalId: "PASSIVE"
});
assert.equal(random.is_random_event, true);
assert.equal(random.questId, "Q-002");
assert.equal(random.gmn, "G");
assert.equal(questTypeForTask({ ...random, status: "Not Started" }), "emergency");
assert.equal(questTypeForTask({ ...random, status: "Promoted" }), "main");

const original = { id: "T-001", name: "整理客户问题", questId: "Q-003", gmn: "G" };
const renamed = pivotTask(original, "renamed", "整理客户付款问题", "标题不准确");
assert.equal(renamed.tasks[0].pivot_status, "renamed");
assert.equal(renamed.tasks[0].original_title, "整理客户问题");
assert.equal(renamed.log.actual_task_id, "T-001");

const paused = pivotTask(original, "paused_for_new_task", "先处理银行限制", "真正卡点是银行限制");
assert.equal(paused.tasks[0].status, "Paused");
assert.equal(paused.tasks[0].generated_task_id, "T-PVT-test");
assert.equal(paused.log.original_task_id, "T-001");
assert.equal(paused.log.actual_task_id, "T-PVT-test");

const discovery = pivotTask(original, "completed_as_discovery", "建立付款资料清单", "A 的价值是发现资料缺口");
assert.equal(discovery.tasks[0].status, "Discovery");
assert.equal(discovery.log.is_pivoted, true);
assert.equal(questTypeForTask(discovery.tasks[0]), "pivot");

console.log("Plan RPG dynamic task logic tests passed.");
