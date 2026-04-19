import {
  assertMountNode,
  clearNode,
  createElement,
  normalizeWords,
  shuffleCopy,
  updateFeedback
} from "./utils.js";

const DEFAULT_LABELS = {
  prompt: "Match pairs",
  successPair: "Correct pair",
  failPair: "Wrong pair",
  complete: "All pairs matched"
};

function normalizePairs(rawPairs) {
  if (!Array.isArray(rawPairs)) {
    return [];
  }

  return rawPairs
    .map((pair, index) => ({
      id: pair?.id ? String(pair.id) : `pair-${index + 1}`,
      left: pair?.left ? String(pair.left) : "",
      right: pair?.right ? String(pair.right) : ""
    }))
    .filter((pair) => pair.left && pair.right);
}

export function createMatchingTiles(mountNode, config = {}) {
  assertMountNode(mountNode, "createMatchingTiles");

  const labels = {
    ...DEFAULT_LABELS,
    ...(config.labels || {})
  };

  let pairs = normalizePairs(config.pairs);
  let selectedLeft = null;
  let selectedRight = null;
  let matchedCount = 0;

  const shell = createElement(document, "section", {
    className: "tc-module tc-matching-tiles"
  });

  const prompt = createElement(document, "p", {
    className: "tc-prompt",
    text: config.prompt || labels.prompt
  });

  const board = createElement(document, "div", {
    className: "tc-match-board"
  });

  const leftColumn = createElement(document, "div", {
    className: "tc-match-column"
  });

  const rightColumn = createElement(document, "div", {
    className: "tc-match-column"
  });

  const feedback = createElement(document, "p", {
    className: "tc-feedback tc-feedback-neutral"
  });

  board.appendChild(leftColumn);
  board.appendChild(rightColumn);

  shell.appendChild(prompt);
  shell.appendChild(board);
  shell.appendChild(feedback);

  function clearSelections() {
    selectedLeft = null;
    selectedRight = null;

    const activeTiles = shell.querySelectorAll(".tc-match-tile-active");
    for (const tile of activeTiles) {
      tile.classList.remove("tc-match-tile-active");
    }
  }

  function markMismatch(leftTile, rightTile) {
    leftTile.classList.add("tc-match-tile-error", "tc-shake");
    rightTile.classList.add("tc-match-tile-error", "tc-shake");

    setTimeout(() => {
      leftTile.classList.remove("tc-match-tile-error", "tc-shake");
      rightTile.classList.remove("tc-match-tile-error", "tc-shake");
    }, 360);
  }

  function markMatch(leftTile, rightTile) {
    leftTile.classList.remove("tc-match-tile-active");
    rightTile.classList.remove("tc-match-tile-active");

    leftTile.classList.add("tc-match-tile-correct");
    rightTile.classList.add("tc-match-tile-correct");

    leftTile.disabled = true;
    rightTile.disabled = true;
  }

  function handleSelection() {
    if (!selectedLeft || !selectedRight) {
      return;
    }

    const leftPairId = selectedLeft.dataset.pairId;
    const rightPairId = selectedRight.dataset.pairId;

    if (leftPairId === rightPairId) {
      matchedCount += 1;
      markMatch(selectedLeft, selectedRight);
      updateFeedback(feedback, labels.successPair, "success");

      if (typeof config.onMatch === "function") {
        config.onMatch({
          pairId: leftPairId,
          matchedCount,
          total: pairs.length
        });
      }

      if (matchedCount === pairs.length) {
        updateFeedback(feedback, labels.complete, "success");

        if (typeof config.onComplete === "function") {
          config.onComplete({
            matchedCount,
            total: pairs.length
          });
        }
      }
    } else {
      markMismatch(selectedLeft, selectedRight);
      updateFeedback(feedback, labels.failPair, "error");

      if (typeof config.onMismatch === "function") {
        config.onMismatch({
          leftPairId,
          rightPairId,
          matchedCount,
          total: pairs.length
        });
      }
    }

    clearSelections();
  }

  function bindTile(tile, side) {
    tile.addEventListener("click", () => {
      if (tile.disabled) {
        return;
      }

      if (side === "left") {
        if (selectedLeft === tile) {
          tile.classList.remove("tc-match-tile-active");
          selectedLeft = null;
          return;
        }

        if (selectedLeft) {
          selectedLeft.classList.remove("tc-match-tile-active");
        }

        selectedLeft = tile;
      } else {
        if (selectedRight === tile) {
          tile.classList.remove("tc-match-tile-active");
          selectedRight = null;
          return;
        }

        if (selectedRight) {
          selectedRight.classList.remove("tc-match-tile-active");
        }

        selectedRight = tile;
      }

      tile.classList.add("tc-match-tile-active");
      handleSelection();
    });
  }

  function renderBoard() {
    leftColumn.innerHTML = "";
    rightColumn.innerHTML = "";

    const leftItems = shuffleCopy(pairs);
    const rightItems = shuffleCopy(pairs);

    for (const pair of leftItems) {
      const tile = createElement(document, "button", {
        className: "tc-match-tile",
        text: pair.left,
        attrs: {
          type: "button"
        },
        dataset: {
          pairId: pair.id
        }
      });

      bindTile(tile, "left");
      leftColumn.appendChild(tile);
    }

    for (const pair of rightItems) {
      const tile = createElement(document, "button", {
        className: "tc-match-tile",
        text: pair.right,
        attrs: {
          type: "button"
        },
        dataset: {
          pairId: pair.id
        }
      });

      bindTile(tile, "right");
      rightColumn.appendChild(tile);
    }
  }

  function setPairs(nextPairs) {
    pairs = normalizePairs(nextPairs);
    matchedCount = 0;
    clearSelections();
    updateFeedback(feedback, "", "neutral");
    renderBoard();
  }

  function reset() {
    setPairs(pairs);
  }

  function getProgress() {
    return {
      matchedCount,
      total: pairs.length,
      percent: pairs.length ? Math.round((matchedCount / pairs.length) * 100) : 0
    };
  }

  function destroy() {
    clearNode(mountNode);
  }

  clearNode(mountNode);
  mountNode.appendChild(shell);
  setPairs(pairs);

  return {
    reset,
    setPairs,
    getProgress,
    destroy
  };
}
