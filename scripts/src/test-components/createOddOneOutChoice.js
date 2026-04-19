import {
  assertMountNode,
  clearNode,
  createElement,
  normalizeWords,
  shuffleCopy,
  updateFeedback
} from "./utils.js";
import { areNorwegianTextEqual, normalizeNorwegianText } from "../core/lang/norwegianText.js";

const DEFAULT_LABELS = {
  prompt: "Choose the odd one out",
  success: "Correct. You found the odd item.",
  fail: "Incorrect choice.",
  explanationPrefix: "Explanation"
};

function normalizeItem(item) {
  return {
    prompt: item?.prompt ? String(item.prompt) : "",
    options: normalizeWords(item?.options),
    answer: normalizeNorwegianText(item?.answer, {
      lowerCase: false
    }),
    explanation: item?.explanation ? String(item.explanation) : ""
  };
}

export function createOddOneOutChoice(mountNode, config = {}) {
  assertMountNode(mountNode, "createOddOneOutChoice");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  let currentItem = normalizeItem(config.item);
  let locked = false;

  const shell = createElement(document, "section", {
    className: "tc-module tc-odd-one-out"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: currentItem.prompt || labels.prompt
  });

  const optionsGrid = createElement(document, "div", {
    className: "tc-options-grid"
  });

  const feedback = createElement(document, "p", {
    className: "tc-feedback tc-feedback-neutral"
  });

  const explanation = createElement(document, "p", {
    className: "tc-help"
  });

  shell.appendChild(prompt);
  shell.appendChild(optionsGrid);
  shell.appendChild(feedback);
  shell.appendChild(explanation);

  function setLocked(value) {
    locked = value;
  }

  function clearSelectionState() {
    const buttons = optionsGrid.querySelectorAll("button");
    for (const button of buttons) {
      button.disabled = false;
      button.classList.remove("tc-option-correct", "tc-option-error");
    }
  }

  function submit(selected, selectedButton) {
    if (locked) {
      return null;
    }

    setLocked(true);

    const isCorrect = areNorwegianTextEqual(selected, currentItem.answer);
    const buttons = optionsGrid.querySelectorAll("button");

    for (const button of buttons) {
      button.disabled = true;

      if (areNorwegianTextEqual(button.dataset.value, currentItem.answer)) {
        button.classList.add("tc-option-correct");
      }
    }

    if (!isCorrect && selectedButton) {
      selectedButton.classList.add("tc-option-error");
    }

    updateFeedback(feedback, isCorrect ? labels.success : labels.fail, isCorrect ? "success" : "error");

    if (currentItem.explanation) {
      explanation.textContent = `${labels.explanationPrefix}: ${currentItem.explanation}`;
    }

    const result = {
      isCorrect,
      selected,
      answer: currentItem.answer,
      explanation: currentItem.explanation
    };

    if (typeof config.onAnswer === "function") {
      config.onAnswer(result);
    }

    return result;
  }

  function renderOptions() {
    optionsGrid.innerHTML = "";

    const variants = config.shuffleOptions === false
      ? [...currentItem.options]
      : shuffleCopy(currentItem.options);

    for (const option of variants) {
      const button = createElement(document, "button", {
        className: "tc-option-card",
        text: option,
        attrs: {
          type: "button"
        },
        dataset: {
          value: option
        }
      });

      button.addEventListener("click", () => {
        submit(option, button);
      });

      optionsGrid.appendChild(button);
    }
  }

  function setItem(nextItem) {
    currentItem = normalizeItem(nextItem);
    prompt.textContent = currentItem.prompt || labels.prompt;
    renderOptions();
    clearSelectionState();
    updateFeedback(feedback, "", "neutral");
    explanation.textContent = "";
    setLocked(false);
  }

  function reset() {
    clearSelectionState();
    updateFeedback(feedback, "", "neutral");
    explanation.textContent = "";
    setLocked(false);
  }

  function destroy() {
    clearNode(mountNode);
  }

  clearNode(mountNode);
  mountNode.appendChild(shell);
  setItem(currentItem);

  return {
    submit,
    setItem,
    reset,
    destroy
  };
}
