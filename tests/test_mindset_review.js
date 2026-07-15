const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
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
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
});

[
  "src/config/app-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/storage/local-cache.js",
  "src/services/task-service.js",
  "src/services/session-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  data = normalizeData({
    logs: [
      { id: "L-MEDITATION-1", date: "2026-07-15", minutes: 10, questId: "Q-004", taskId: "T-007" },
      { id: "L-MEDITATION-2", date: "2026-07-15", minutes: 10, questId: "Q-004", taskId: "T-007" },
      { id: "L-MEDITATION-3", date: "2026-07-15", minutes: 10, questId: "Q-004", taskId: "T-007" },
      { id: "L-REVIEW", date: "2026-07-15", minutes: 20, questId: "Q-038", taskId: "T-041" }
    ]
  });
  const mindset = data.quests.find(quest => quest.id === "Q-039");
  const meditation = data.quests.find(quest => quest.id === "Q-004");
  const review = data.quests.find(quest => quest.id === "Q-038");
  const reviewTask = data.tasks.find(task => task.id === "T-041");
  JSON.stringify({
    mindsetId: mindset.id,
    chapterIds: chapterQuestsForCampaign("Q-039").map(quest => quest.id),
    meditationParent: meditation.parentQuestId,
    meditationCurrent: meditation.currentValue,
    reviewParent: review.parentQuestId,
    reviewGmn: review.gmn,
    reviewTaskGmn: reviewTask.gmn,
    reviewTaskMinutes: reviewTask.minutes,
    reviewIsMeditation: isMeditationTask(reviewTask)
  });
`, context));

assert.equal(result.mindsetId, "Q-039");
assert.deepEqual(result.chapterIds, ["Q-004", "Q-038"]);
assert.equal(result.meditationParent, "Q-039");
assert.equal(result.meditationCurrent, 83);
assert.equal(result.reviewParent, "Q-039");
assert.equal(result.reviewGmn, "G");
assert.equal(result.reviewTaskGmn, "G");
assert.equal(result.reviewTaskMinutes, 20);
assert.equal(result.reviewIsMeditation, false);

console.log("Plan RPG mindset review tests passed.");
