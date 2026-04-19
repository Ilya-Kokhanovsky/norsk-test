import {
  assertMountNode,
  clearNode,
  createElement,
  updateFeedback
} from "./utils.js";

const DEFAULT_LABELS = {
  prompt: "Is this sentence correct?",
  rightButton: "Riktig",
  wrongButton: "Feil",
  success: "Correct. Nice grammar intuition.",
  fail: "Not this time. Review the sentence and try another.",
  explanationPrefix: "Explanation"
};

function normalizeItem(item) {
  return {
    statement: item?.statement ? String(item.statement) : "",
    isCorrect: Boolean(item?.isCorrect),
    explanationIfRight: item?.explanationIfRight ? String(item.explanationIfRight) : "",
    explanationIfWrong: item?.explanationIfWrong ? String(item.explanationIfWrong) : ""
  };
}

export function createBinaryChoice(mountNode, config = {}) {
  assertMountNode(mountNode, "createBinaryChoice");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  let currentItem = normalizeItem(config.item);
  let locked = false;

  const shell = createElement(document, "section", {
    className: "tc-module tc-binary-choice"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: labels.prompt
  });

  const statement = createElement(document, "div", {
    className: "tc-statement",
    text: currentItem.statement
  });

  const controls = createElement(document, "div", {
    className: "tc-button-row"
  });

  const rightButton = createElement(document, "button", {
    className: "tc-choice-button",
    text: labels.rightButton,
    attrs: {
      type: "button"
    }
  });

  const wrongButton = createElement(document, "button", {
    className: "tc-choice-button",
    text: labels.wrongButton,
    attrs: {
      type: "button"
    }
  });

  const feedback = createElement(document, "p", {
    className: "tc-feedback tc-feedback-neutral"
  });

  const explanation = createElement(document, "p", {
    className: "tc-help"
  });

  controls.appendChild(rightButton);
  controls.appendChild(wrongButton);

  shell.appendChild(prompt);
  shell.appendChild(statement);
  shell.appendChild(controls);
  shell.appendChild(feedback);
  shell.appendChild(explanation);

  function resetVisualState() {
    locked = false;
    rightButton.disabled = false;
    wrongButton.disabled = false;

    rightButton.classList.remove("tc-choice-correct", "tc-choice-error");
    wrongButton.classList.remove("tc-choice-correct", "tc-choice-error");

    updateFeedback(feedback, "", "neutral");
    explanation.textContent = "";
  }

  function submit(userChoice) {
    if (locked) {
      return null;
    }

    locked = true;

    const isCorrectAnswer = userChoice === currentItem.isCorrect;
    const explanationText = userChoice
      ? currentItem.explanationIfRight
      : currentItem.explanationIfWrong;

    rightButton.disabled = true;
    wrongButton.disabled = true;

    if (userChoice) {
      rightButton.classList.add(isCorrectAnswer ? "tc-choice-correct" : "tc-choice-error");
      if (!isCorrectAnswer) {
        wrongButton.classList.add("tc-choice-correct");
      }
    } else {
      wrongButton.classList.add(isCorrectAnswer ? "tc-choice-correct" : "tc-choice-error");
      if (!isCorrectAnswer) {
        rightButton.classList.add("tc-choice-correct");
      }
    }

    updateFeedback(feedback, isCorrectAnswer ? labels.success : labels.fail, isCorrectAnswer ? "success" : "error");

    if (explanationText) {
      explanation.textContent = `${labels.explanationPrefix}: ${explanationText}`;
    }

    const result = {
      isCorrect: isCorrectAnswer,
      expected: currentItem.isCorrect,
      selected: userChoice,
      explanation: explanationText
    };

    if (typeof config.onAnswer === "function") {
      config.onAnswer(result);
    }

    return result;
  }

  rightButton.addEventListener("click", () => {
    submit(true);
  });

  wrongButton.addEventListener("click", () => {
    submit(false);
  });

  function setItem(nextItem) {
    currentItem = normalizeItem(nextItem);
    statement.textContent = currentItem.statement;
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

  return {
    submit,
    setItem,
    reset,
    destroy
  };
}
