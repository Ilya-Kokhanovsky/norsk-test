import { pickRandom } from "../utils/random.js";
import { assertValidDataset } from "../../foundation/testValidators.js";
import { createScoreTracker } from "./createScoreTracker.js";
import { createQuestionStrategyFactory } from "./strategyFactory.js";

function pickNextItem(items, recentIds, recentWindow, pickItemFn) {
  const safeWindow = Number.isInteger(recentWindow) && recentWindow > 0 ? recentWindow : 0;
  const recentSet = safeWindow > 0 ? new Set(recentIds) : null;

  let pool = safeWindow > 0
    ? items.filter((item) => !recentSet.has(item.id))
    : items;

  if (!pool.length) {
    pool = items;
  }

  const selected = pickItemFn(pool);
  if (!selected) {
    throw new Error("Question pool is empty");
  }

  if (safeWindow > 0) {
    recentIds.push(selected.id);
    if (recentIds.length > safeWindow) {
      recentIds.shift();
    }
  }

  return selected;
}

function buildFallbackMeta(items, config) {
  const answerSet = new Set();

  for (const item of items) {
    const answer = item?.[config.answerField];
    if (typeof answer === "string" && answer.trim()) {
      answerSet.add(answer.trim());
    }
  }

  return {
    questionCount: items.length,
    entityCount: answerSet.size,
    optionCount: config.optionCount
  };
}

export function createSession(config, dataset, dependencies = {}) {
  assertValidDataset(dataset, {
    promptField: config.promptField,
    answerField: config.answerField
  });

  const items = Array.isArray(dataset?.items) ? dataset.items : [];
  if (!items.length) {
    throw new Error(`Dataset ${config.datasetPath} does not contain items`);
  }

  const strategyFactory = dependencies.strategyFactory || createQuestionStrategyFactory(dependencies.customStrategies);

  let strategy;
  try {
    strategy = strategyFactory.resolve(config.mode, {
      config,
      dataset,
      items
    });
  } catch (error) {
    throw new Error(`Unable to initialize strategy for mode ${config.mode}: ${error.message}`);
  }

  const scoreTracker = createScoreTracker();
  const pickItemFn = typeof dependencies.pickItem === "function" ? dependencies.pickItem : pickRandom;

  const state = {
    currentQuestion: null,
    answered: false,
    recentIds: []
  };

  function reset() {
    state.currentQuestion = null;
    state.answered = false;
    state.recentIds = [];
    scoreTracker.reset();
  }

  function nextQuestion() {
    state.answered = false;

    const item = pickNextItem(items, state.recentIds, config.recentWindow, pickItemFn);
    try {
      state.currentQuestion = strategy.createQuestion(item);
    } catch (error) {
      throw new Error(`Failed to build question from item ${item?.id ?? "unknown"}: ${error.message}`);
    }

    return {
      ...state.currentQuestion,
      questionLabel: config.questionLabel
    };
  }

  function submitAnswer(selected) {
    if (!state.currentQuestion || state.answered) {
      return null;
    }

    let result;

    try {
      result = strategy.evaluateAnswer(state.currentQuestion, selected);
    } catch (error) {
      throw new Error(`Failed to evaluate submitted answer: ${error.message}`);
    }
    if (!result) {
      return null;
    }

    state.answered = true;
    const scoreState = scoreTracker.recordAnswer(Boolean(result.isCorrect));

    return {
      ...result,
      streakCount: scoreState.streakCount,
      shouldShowStreak: scoreState.streakCount > 0 && scoreState.streakCount % 5 === 0,
      counts: scoreState.counts
    };
  }

  function finish() {
    return scoreTracker.getSummary();
  }

  function getMeta() {
    if (typeof strategy.getMeta === "function") {
      return strategy.getMeta();
    }

    return buildFallbackMeta(items, config);
  }

  function getCounts() {
    return scoreTracker.getCounts();
  }

  reset();

  return {
    reset,
    nextQuestion,
    submitAnswer,
    finish,
    getMeta,
    getCounts
  };
}
