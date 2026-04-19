import { createBinaryChoice } from "./createBinaryChoice.js";
import { createBucketSort } from "./createBucketSort.js";
import { createClozeChoice } from "./createClozeChoice.js";
import { createMatchingTiles } from "./createMatchingTiles.js";
import { createOddOneOutChoice } from "./createOddOneOutChoice.js";
import { createSentenceBuilder } from "./createSentenceBuilder.js";

const builtInFactories = {
  "sentence-builder": createSentenceBuilder,
  "bucket-sort": createBucketSort,
  "binary-choice": createBinaryChoice,
  "cloze-choice": createClozeChoice,
  "matching-tiles": createMatchingTiles,
  "odd-one-out": createOddOneOutChoice
};

export function createTestComposer(config = {}) {
  const registry = new Map(Object.entries({
    ...builtInFactories,
    ...(config.factories || {})
  }));

  function register(type, factory) {
    if (!type || typeof factory !== "function") {
      throw new Error("register(type, factory) requires a non-empty type and function");
    }

    registry.set(type, factory);
  }

  function unregister(type) {
    registry.delete(type);
  }

  function create(type, mountNode, options = {}) {
    const factory = registry.get(type);
    if (!factory) {
      throw new Error(`Unknown test component type: ${type}`);
    }

    return factory(mountNode, options);
  }

  function listTypes() {
    return [...registry.keys()];
  }

  return {
    create,
    register,
    unregister,
    listTypes
  };
}

export const TEST_COMPONENT_TYPES = Object.freeze(Object.keys(builtInFactories));
