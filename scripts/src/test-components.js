import {
  createBinaryChoice,
  createBucketSort,
  createClozeChoice,
  createFeedbackKit,
  createMatchingTiles,
  createOddOneOutChoice,
  createSentenceBuilder,
  createTestComposer,
  createV2PositionValidator,
  TEST_COMPONENT_TYPES
} from "./test-components/index.js";
import { initI18n } from "./foundation/i18n.js";

const NorskTestComponents = Object.freeze({
  createBinaryChoice,
  createBucketSort,
  createClozeChoice,
  createFeedbackKit,
  createMatchingTiles,
  createOddOneOutChoice,
  createSentenceBuilder,
  createTestComposer,
  createV2PositionValidator,
  TEST_COMPONENT_TYPES
});

window.NorskTestComponents = NorskTestComponents;

initI18n().catch(() => {});

document.dispatchEvent(
  new CustomEvent("norsk:test-components:ready", {
    detail: {
      types: TEST_COMPONENT_TYPES
    }
  })
);
