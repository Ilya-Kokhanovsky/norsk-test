import { createMultipleChoiceStrategy } from "./strategies/multipleChoiceStrategy.js";

const BUILT_IN_STRATEGIES = Object.freeze({
  "multiple-choice": createMultipleChoiceStrategy
});

export function createQuestionStrategyFactory(customStrategies = {}) {
  const strategyRegistry = new Map(Object.entries({
    ...BUILT_IN_STRATEGIES,
    ...customStrategies
  }));

  function register(mode, strategyFactory) {
    if (typeof mode !== "string" || !mode.trim()) {
      throw new Error("register(mode, strategyFactory) requires a non-empty mode");
    }

    if (typeof strategyFactory !== "function") {
      throw new Error("register(mode, strategyFactory) requires a strategy factory function");
    }

    strategyRegistry.set(mode, strategyFactory);
  }

  function resolve(mode, context) {
    const strategyFactory = strategyRegistry.get(mode);

    if (!strategyFactory) {
      throw new Error(`Unsupported test mode: ${mode}`);
    }

    const strategy = strategyFactory(context);

    if (!strategy || typeof strategy !== "object") {
      throw new Error(`Strategy factory for mode \"${mode}\" did not return a valid strategy object`);
    }

    if (typeof strategy.createQuestion !== "function") {
      throw new Error(`Strategy for mode \"${mode}\" must implement createQuestion(item)`);
    }

    if (typeof strategy.evaluateAnswer !== "function") {
      throw new Error(`Strategy for mode \"${mode}\" must implement evaluateAnswer(question, selected)`);
    }

    return strategy;
  }

  function listModes() {
    return [...strategyRegistry.keys()];
  }

  return {
    register,
    resolve,
    listModes
  };
}
