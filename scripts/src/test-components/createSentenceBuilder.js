import Sortable from "sortablejs";
import {
  assertMountNode,
  clearNode,
  createElement,
  createWordModels,
  normalizeWords,
  shuffleCopy,
  updateFeedback
} from "./utils.js";
import {
  areNorwegianWordArraysEqual,
  findNorwegianTokenIndex,
  normalizeNorwegianText
} from "../core/lang/norwegianText.js";

const DEFAULT_LABELS = {
  prompt: "Build the correct sentence",
  bankTitle: "Word bank",
  answerTitle: "Your sentence",
  answerPlaceholder: "Tap or drag words here",
  checkButton: "Check",
  resetButton: "Reset",
  success: "Correct sentence order.",
  fail: "Not yet. Try a different order.",
  v2Hint: "In Norwegian V2, the finite verb should be in the second position.",
  v2MissingVerb: "Finite verb is missing in your sentence."
};

function normalizeValidation(result, fallbackMessage) {
  if (!result || typeof result !== "object") {
    return {
      isCorrect: false,
      message: fallbackMessage,
      issues: []
    };
  }

  return {
    isCorrect: Boolean(result.isCorrect),
    message: result.message ? String(result.message) : fallbackMessage,
    issues: Array.isArray(result.issues) ? result.issues : []
  };
}

function createDefaultValidator(expectedWords, labels, config) {
  return (answerWords) => {
    const exactMatch = areNorwegianWordArraysEqual(answerWords, expectedWords);
    const issues = [];

    if (config.v2Verb) {
      const index = findNorwegianTokenIndex(answerWords, config.v2Verb);

      if (index < 0) {
        issues.push({
          type: "v2-missing",
          tokenIndex: null,
          message: labels.v2MissingVerb
        });
      } else if (index !== 1) {
        issues.push({
          type: "v2",
          tokenIndex: index,
          message: labels.v2Hint
        });
      }
    }

    return {
      isCorrect: exactMatch,
      message: exactMatch ? labels.success : labels.fail,
      issues
    };
  };
}

export function createV2PositionValidator(verb, options = {}) {
  const expectedIndex = Number.isInteger(options.expectedIndex) ? options.expectedIndex : 1;
  const normalizedVerb = normalizeNorwegianText(verb, {
    lowerCase: false
  });

  return (answerWords) => {
    const tokenIndex = findNorwegianTokenIndex(answerWords, normalizedVerb);

    if (tokenIndex < 0) {
      return {
        isCorrect: false,
        message: `Verb \"${normalizedVerb}\" is missing in the sentence`,
        issues: [
          {
            type: "v2-missing",
            tokenIndex: null
          }
        ]
      };
    }

    if (tokenIndex !== expectedIndex) {
      return {
        isCorrect: false,
        message: `Verb \"${normalizedVerb}\" should be at position ${expectedIndex + 1}`,
        issues: [
          {
            type: "v2",
            tokenIndex
          }
        ]
      };
    }

    return {
      isCorrect: true,
      message: "V2 position is valid",
      issues: []
    };
  };
}

export function createSentenceBuilder(mountNode, config = {}) {
  assertMountNode(mountNode, "createSentenceBuilder");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  const expectedWords = normalizeWords(config.correctSequence || config.answer);
  const sourceWords = normalizeWords(config.wordBank || config.words || expectedWords);
  const wordModels = createWordModels(sourceWords);

  let onChangeCallback = typeof config.onChange === "function" ? config.onChange : null;
  let onCheckCallback = typeof config.onCheck === "function" ? config.onCheck : null;

  const validator = typeof config.validate === "function"
    ? config.validate
    : createDefaultValidator(expectedWords, labels, config);

  const shell = createElement(document, "section", {
    className: "tc-module tc-sentence-builder"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: config.prompt || labels.prompt
  });

  const answerTitle = createElement(document, "p", {
    className: "tc-subtitle",
    text: labels.answerTitle
  });

  const answerZone = createElement(document, "div", {
    className: "tc-dropzone tc-answer-zone",
    attrs: {
      role: "list"
    }
  });

  const answerPlaceholder = createElement(document, "p", {
    className: "tc-placeholder",
    text: labels.answerPlaceholder
  });

  const bankTitle = createElement(document, "p", {
    className: "tc-subtitle",
    text: labels.bankTitle
  });

  const bankZone = createElement(document, "div", {
    className: "tc-dropzone tc-bank-zone",
    attrs: {
      role: "list"
    }
  });

  const controls = createElement(document, "div", {
    className: "tc-button-row"
  });

  const resetButton = createElement(document, "button", {
    className: "tc-button tc-button-ghost",
    text: labels.resetButton,
    attrs: {
      type: "button"
    }
  });

  const checkButton = createElement(document, "button", {
    className: "tc-button tc-button-primary",
    text: labels.checkButton,
    attrs: {
      type: "button"
    }
  });

  const feedback = createElement(document, "p", {
    className: "tc-feedback tc-feedback-neutral"
  });

  controls.appendChild(resetButton);
  controls.appendChild(checkButton);

  shell.appendChild(prompt);
  shell.appendChild(answerTitle);
  shell.appendChild(answerZone);
  shell.appendChild(bankTitle);
  shell.appendChild(bankZone);
  shell.appendChild(controls);
  shell.appendChild(feedback);

  function createTokenNode(model) {
    const token = createElement(document, "button", {
      className: "tc-token",
      text: model.word,
      attrs: {
        type: "button",
        draggable: "false"
      },
      dataset: {
        tokenId: model.id,
        word: model.word
      }
    });

    return token;
  }

  const tokenNodes = shuffleCopy(wordModels).map(createTokenNode);

  for (const tokenNode of tokenNodes) {
    bankZone.appendChild(tokenNode);
  }

  answerZone.appendChild(answerPlaceholder);

  const sortableOptions = {
    animation: 160,
    group: {
      name: `tc-sentence-builder-${Math.random().toString(36).slice(2, 9)}`,
      pull: true,
      put: true
    },
    draggable: ".tc-token",
    ghostClass: "tc-token-ghost",
    dragClass: "tc-token-drag"
  };

  const bankSortable = Sortable.create(bankZone, {
    ...sortableOptions,
    onSort: handleSortingChange,
    onAdd: handleSortingChange
  });

  const answerSortable = Sortable.create(answerZone, {
    ...sortableOptions,
    onSort: handleSortingChange,
    onAdd: handleSortingChange
  });

  function getAnswerWords() {
    return [...answerZone.querySelectorAll(".tc-token")].map((node) => node.dataset.word);
  }

  function clearTokenStates() {
    for (const tokenNode of tokenNodes) {
      tokenNode.classList.remove("tc-token-success", "tc-token-error");
    }
  }

  function syncPlaceholder() {
    const answerCount = answerZone.querySelectorAll(".tc-token").length;
    answerPlaceholder.classList.toggle("tc-hidden", answerCount > 0);
  }

  function handleSortingChange() {
    clearTokenStates();
    updateFeedback(feedback, "", "neutral");
    syncPlaceholder();

    const payload = {
      answerWords: getAnswerWords()
    };

    if (onChangeCallback) {
      onChangeCallback(payload);
    }
  }

  function markIssues(validationResult) {
    clearTokenStates();

    const answerTokens = [...answerZone.querySelectorAll(".tc-token")];

    if (validationResult.isCorrect) {
      for (const tokenNode of answerTokens) {
        tokenNode.classList.add("tc-token-success");
      }
      return;
    }

    if (!validationResult.issues.length) {
      for (const tokenNode of answerTokens) {
        tokenNode.classList.add("tc-token-error");
      }
      return;
    }

    for (const issue of validationResult.issues) {
      if (Number.isInteger(issue.tokenIndex) && answerTokens[issue.tokenIndex]) {
        answerTokens[issue.tokenIndex].classList.add("tc-token-error");
      }
    }
  }

  function validate() {
    const answerWords = getAnswerWords();
    const rawResult = validator(answerWords, expectedWords, {
      labels,
      config
    });

    const result = normalizeValidation(rawResult, labels.fail);

    markIssues(result);
    updateFeedback(feedback, result.message, result.isCorrect ? "success" : "error");

    if (onCheckCallback) {
      onCheckCallback({
        ...result,
        answerWords,
        expectedWords
      });
    }

    return {
      ...result,
      answerWords,
      expectedWords
    };
  }

  function reset() {
    clearTokenStates();
    updateFeedback(feedback, "", "neutral");

    for (const tokenNode of shuffleCopy(tokenNodes)) {
      bankZone.appendChild(tokenNode);
    }

    syncPlaceholder();
  }

  function setCallbacks(nextCallbacks = {}) {
    onChangeCallback = typeof nextCallbacks.onChange === "function" ? nextCallbacks.onChange : onChangeCallback;
    onCheckCallback = typeof nextCallbacks.onCheck === "function" ? nextCallbacks.onCheck : onCheckCallback;
  }

  function destroy() {
    bankSortable.destroy();
    answerSortable.destroy();
    clearNode(mountNode);
  }

  shell.addEventListener("click", (event) => {
    const token = event.target.closest(".tc-token");
    if (!token) {
      return;
    }

    if (token.parentElement === bankZone) {
      answerZone.appendChild(token);
    } else {
      bankZone.appendChild(token);
    }

    handleSortingChange();
  });

  resetButton.addEventListener("click", () => {
    reset();
  });

  checkButton.addEventListener("click", () => {
    validate();
  });

  clearNode(mountNode);
  mountNode.appendChild(shell);
  syncPlaceholder();

  return {
    getValue: getAnswerWords,
    validate,
    reset,
    setCallbacks,
    destroy
  };
}
