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
  prompt: "Choose the missing element",
  success: "Correct option.",
  fail: "Incorrect option.",
  explanationPrefix: "Explanation"
};

function normalizeItem(item) {
  const options = normalizeWords(item?.options);
  const answer = normalizeNorwegianText(item?.answer, {
    lowerCase: false
  });
  const template = item?.template ? String(item.template) : "";

  return {
    template,
    options,
    answer,
    explanation: item?.explanation ? String(item.explanation) : ""
  };
}

function renderTemplate(sentenceNode, templateText, placeholderNode, marker = "___") {
  sentenceNode.innerHTML = "";

  const markerIndex = templateText.indexOf(marker);
  if (markerIndex < 0) {
    sentenceNode.appendChild(document.createTextNode(templateText));
    sentenceNode.appendChild(document.createTextNode(" "));
    sentenceNode.appendChild(placeholderNode);
    return;
  }

  const before = templateText.slice(0, markerIndex);
  const after = templateText.slice(markerIndex + marker.length);

  sentenceNode.appendChild(document.createTextNode(before));
  sentenceNode.appendChild(placeholderNode);
  sentenceNode.appendChild(document.createTextNode(after));
}

export function createClozeChoice(mountNode, config = {}) {
  assertMountNode(mountNode, "createClozeChoice");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  const marker = config.placeholderMarker || "___";
  let currentItem = normalizeItem(config.item);
  let locked = false;

  const shell = createElement(document, "section", {
    className: "tc-module tc-cloze-choice"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: labels.prompt
  });

  const sentence = createElement(document, "p", {
    className: "tc-sentence"
  });

  const blank = createElement(document, "span", {
    className: "tc-blank",
    text: marker
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
  shell.appendChild(sentence);
  shell.appendChild(optionsGrid);
  shell.appendChild(feedback);
  shell.appendChild(explanation);

  function buildOptions() {
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
          optionValue: option
        }
      });

      button.addEventListener("click", () => {
        submit(option, button);
      });

      optionsGrid.appendChild(button);
    }
  }

  function resetVisualState() {
    locked = false;
    updateFeedback(feedback, "", "neutral");
    explanation.textContent = "";
    blank.textContent = marker;

    const buttons = optionsGrid.querySelectorAll("button");
    for (const button of buttons) {
      button.disabled = false;
      button.classList.remove("tc-option-correct", "tc-option-error");
    }
  }

  function submit(value, selectedButton) {
    if (locked) {
      return null;
    }

    locked = true;

    const isCorrect = areNorwegianTextEqual(value, currentItem.answer);
    const buttons = optionsGrid.querySelectorAll("button");

    blank.textContent = value;

    for (const button of buttons) {
      button.disabled = true;

      if (areNorwegianTextEqual(button.dataset.optionValue, currentItem.answer)) {
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
      selected: value,
      answer: currentItem.answer,
      explanation: currentItem.explanation
    };

    if (typeof config.onAnswer === "function") {
      config.onAnswer(result);
    }

    return result;
  }

  function setItem(nextItem) {
    currentItem = normalizeItem(nextItem);
    renderTemplate(sentence, currentItem.template, blank, marker);
    buildOptions();
    resetVisualState();
  }

  function reset() {
    resetVisualState();
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
