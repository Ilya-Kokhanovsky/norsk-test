import Sortable from "sortablejs";
import {
  assertMountNode,
  clearNode,
  createElement,
  nextId,
  setDisabled,
  shuffleCopy,
  updateFeedback
} from "./utils.js";

const DEFAULT_LABELS = {
  prompt: "Sort cards into categories",
  poolTitle: "Cards",
  checkButton: "Check",
  resetButton: "Reset",
  pending: "Place all cards into buckets first.",
  success: "All cards are in the correct buckets.",
  fail: "Some cards are in the wrong bucket."
};

function normalizeBuckets(rawBuckets) {
  if (!Array.isArray(rawBuckets)) {
    return [];
  }

  return rawBuckets
    .map((bucket) => ({
      id: bucket?.id ? String(bucket.id) : "",
      label: bucket?.label ? String(bucket.label) : ""
    }))
    .filter((bucket) => bucket.id && bucket.label);
}

function normalizeCards(rawCards) {
  if (!Array.isArray(rawCards)) {
    return [];
  }

  return rawCards
    .map((card) => ({
      id: card?.id ? String(card.id) : nextId("card"),
      label: card?.label ? String(card.label) : "",
      bucketId: card?.bucketId ? String(card.bucketId) : ""
    }))
    .filter((card) => card.label && card.bucketId);
}

export function createBucketSort(mountNode, config = {}) {
  assertMountNode(mountNode, "createBucketSort");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  const buckets = normalizeBuckets(config.buckets);
  const cards = normalizeCards(config.cards);
  const cardById = new Map(cards.map((card) => [card.id, card]));

  let onCheckCallback = typeof config.onCheck === "function" ? config.onCheck : null;

  const shell = createElement(document, "section", {
    className: "tc-module tc-bucket-sort"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: config.prompt || labels.prompt
  });

  const layout = createElement(document, "div", {
    className: "tc-bucket-layout"
  });

  const poolSection = createElement(document, "div", {
    className: "tc-bucket-panel"
  });

  const poolTitle = createElement(document, "p", {
    className: "tc-subtitle",
    text: labels.poolTitle
  });

  const poolZone = createElement(document, "div", {
    className: "tc-dropzone tc-pool-zone",
    dataset: {
      zoneType: "pool"
    }
  });

  poolSection.appendChild(poolTitle);
  poolSection.appendChild(poolZone);

  const bucketGrid = createElement(document, "div", {
    className: "tc-bucket-grid"
  });

  const bucketZones = [];

  for (const bucket of buckets) {
    const bucketPanel = createElement(document, "div", {
      className: "tc-bucket-panel"
    });

    const bucketTitle = createElement(document, "p", {
      className: "tc-subtitle",
      text: bucket.label
    });

    const bucketZone = createElement(document, "div", {
      className: "tc-dropzone tc-bucket-zone",
      dataset: {
        zoneType: "bucket",
        bucketId: bucket.id
      }
    });

    bucketPanel.appendChild(bucketTitle);
    bucketPanel.appendChild(bucketZone);
    bucketGrid.appendChild(bucketPanel);

    bucketZones.push(bucketZone);
  }

  layout.appendChild(poolSection);
  layout.appendChild(bucketGrid);

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
  shell.appendChild(layout);
  shell.appendChild(controls);
  shell.appendChild(feedback);

  function createCardNode(card) {
    return createElement(document, "button", {
      className: "tc-card",
      text: card.label,
      attrs: {
        type: "button"
      },
      dataset: {
        cardId: card.id
      }
    });
  }

  const cardNodes = cards.map(createCardNode);

  function clearCardStatus() {
    for (const cardNode of cardNodes) {
      cardNode.classList.remove("tc-card-correct", "tc-card-error");
    }
  }

  function getPlacement() {
    const placement = new Map();

    for (const bucketZone of bucketZones) {
      const bucketId = bucketZone.dataset.bucketId;
      const cardsInBucket = bucketZone.querySelectorAll("[data-card-id]");

      for (const cardNode of cardsInBucket) {
        placement.set(cardNode.dataset.cardId, bucketId);
      }
    }

    return placement;
  }

  function evaluate() {
    const placement = getPlacement();
    clearCardStatus();

    let missingCount = 0;
    let wrongCount = 0;

    for (const cardNode of cardNodes) {
      const card = cardById.get(cardNode.dataset.cardId);
      const placedBucketId = placement.get(card.id) || null;

      if (!placedBucketId) {
        missingCount += 1;
        continue;
      }

      if (placedBucketId === card.bucketId) {
        cardNode.classList.add("tc-card-correct");
      } else {
        wrongCount += 1;
        cardNode.classList.add("tc-card-error");
      }
    }

    const isComplete = missingCount === 0;
    const isCorrect = isComplete && wrongCount === 0;

    if (!isComplete) {
      updateFeedback(feedback, labels.pending, "error");
    } else {
      updateFeedback(feedback, isCorrect ? labels.success : labels.fail, isCorrect ? "success" : "error");
    }

    const result = {
      isComplete,
      isCorrect,
      wrongCount,
      missingCount,
      placement
    };

    if (onCheckCallback) {
      onCheckCallback(result);
    }

    return result;
  }

  function reset() {
    clearCardStatus();
    updateFeedback(feedback, "", "neutral");

    for (const cardNode of shuffleCopy(cardNodes)) {
      poolZone.appendChild(cardNode);
    }
  }

  function moveCardByClick(event) {
    const cardNode = event.target.closest(".tc-card");
    if (!cardNode) {
      return;
    }

    const parentZone = cardNode.parentElement;

    if (parentZone === poolZone && bucketZones.length > 0) {
      bucketZones[0].appendChild(cardNode);
    } else {
      poolZone.appendChild(cardNode);
    }
  }

  const groupName = `tc-bucket-${nextId("group")}`;

  const sortables = [
    Sortable.create(poolZone, {
      animation: 160,
      group: {
        name: groupName,
        pull: true,
        put: true
      },
      draggable: ".tc-card",
      ghostClass: "tc-token-ghost"
    }),
    ...bucketZones.map((zone) =>
      Sortable.create(zone, {
        animation: 160,
        group: {
          name: groupName,
          pull: true,
          put: true
        },
        draggable: ".tc-card",
        ghostClass: "tc-token-ghost"
      })
    )
  ];

  poolZone.addEventListener("click", moveCardByClick);
  for (const zone of bucketZones) {
    zone.addEventListener("click", moveCardByClick);
  }

  checkButton.addEventListener("click", () => {
    evaluate();
  });

  resetButton.addEventListener("click", () => {
    reset();
  });

  clearNode(mountNode);
  mountNode.appendChild(shell);
  reset();

  function setCards(nextCards) {
    cards.length = 0;
    for (const card of normalizeCards(nextCards)) {
      cards.push(card);
      cardById.set(card.id, card);
    }

    poolZone.innerHTML = "";

    cardNodes.length = 0;
    for (const card of cards) {
      const cardNode = createCardNode(card);
      cardNodes.push(cardNode);
      poolZone.appendChild(cardNode);
    }

    updateFeedback(feedback, "", "neutral");
  }

  function lock(disabled = true) {
    setDisabled([checkButton, resetButton], disabled);
  }

  function destroy() {
    for (const sortable of sortables) {
      sortable.destroy();
    }

    clearNode(mountNode);
  }

  return {
    evaluate,
    reset,
    setCards,
    lock,
    destroy
  };
}
