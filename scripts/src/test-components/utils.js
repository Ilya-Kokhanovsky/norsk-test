import { normalizeNorwegianText } from "../core/lang/norwegianText.js";

let idSequence = 0;

export function nextId(prefix = "tc") {
  idSequence += 1;
  return `${prefix}-${idSequence}`;
}

export function assertMountNode(node, componentName) {
  if (!node || !(node instanceof HTMLElement)) {
    throw new Error(`${componentName} requires a valid mount HTMLElement`);
  }
}

export function clearNode(node) {
  if (!node) {
    return;
  }

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function createElement(documentRef, tagName, config = {}) {
  const node = documentRef.createElement(tagName);

  if (config.className) {
    node.className = config.className;
  }

  if (config.text != null) {
    node.textContent = String(config.text);
  }

  if (config.attrs && typeof config.attrs === "object") {
    for (const [name, value] of Object.entries(config.attrs)) {
      node.setAttribute(name, String(value));
    }
  }

  if (config.dataset && typeof config.dataset === "object") {
    for (const [name, value] of Object.entries(config.dataset)) {
      node.dataset[name] = String(value);
    }
  }

  return node;
}

export function shuffleCopy(values) {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function arraysEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}

export function normalizeWords(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => normalizeNorwegianText(value, {
      lowerCase: false
    }))
    .filter((value) => value.length > 0);
}

export function updateFeedback(feedbackNode, message, tone = "neutral") {
  if (!feedbackNode) {
    return;
  }

  feedbackNode.textContent = message || "";
  feedbackNode.classList.remove("tc-feedback-success", "tc-feedback-error", "tc-feedback-neutral");

  if (tone === "success") {
    feedbackNode.classList.add("tc-feedback-success");
    return;
  }

  if (tone === "error") {
    feedbackNode.classList.add("tc-feedback-error");
    return;
  }

  feedbackNode.classList.add("tc-feedback-neutral");
}

export function createWordModels(words) {
  return normalizeWords(words).map((word, index) => ({
    id: nextId("token"),
    word,
    index
  }));
}

export function setDisabled(nodeList, disabled = true) {
  for (const node of nodeList) {
    node.disabled = disabled;
  }
}
