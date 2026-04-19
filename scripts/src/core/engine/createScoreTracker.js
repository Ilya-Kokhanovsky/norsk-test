export function calculateAccuracyPercent(correctCount, totalCount) {
  if (!totalCount) {
    return 0;
  }

  return Math.round((correctCount / totalCount) * 100);
}

export function createScoreTracker() {
  const state = {
    correctCount: 0,
    wrongCount: 0,
    totalCount: 0,
    streakCount: 0
  };

  function reset() {
    state.correctCount = 0;
    state.wrongCount = 0;
    state.totalCount = 0;
    state.streakCount = 0;
  }

  function recordAnswer(isCorrect) {
    if (isCorrect) {
      state.correctCount += 1;
      state.streakCount += 1;
    } else {
      state.wrongCount += 1;
      state.streakCount = 0;
    }

    state.totalCount += 1;

    return {
      counts: {
        correct: state.correctCount,
        wrong: state.wrongCount,
        total: state.totalCount
      },
      streakCount: state.streakCount
    };
  }

  function getCounts() {
    return {
      correct: state.correctCount,
      wrong: state.wrongCount,
      total: state.totalCount
    };
  }

  function getSummary() {
    return {
      ...getCounts(),
      accuracyPercent: calculateAccuracyPercent(state.correctCount, state.totalCount)
    };
  }

  return {
    reset,
    recordAnswer,
    getCounts,
    getSummary
  };
}
