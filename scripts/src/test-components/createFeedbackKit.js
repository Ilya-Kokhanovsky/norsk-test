import ConfettiGeneratorLib from "confetti-js";

function resolveConfettiGenerator() {
  if (typeof ConfettiGeneratorLib === "function") {
    return ConfettiGeneratorLib;
  }

  if (ConfettiGeneratorLib && typeof ConfettiGeneratorLib.default === "function") {
    return ConfettiGeneratorLib.default;
  }

  return null;
}

function createToneMachine() {
  let audioContext = null;

  function ensureContext() {
    if (audioContext) {
      return audioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
    return audioContext;
  }

  function playTone(frequency, durationMs, type = "sine", gainLevel = 0.08) {
    try {
      const context = ensureContext();
      if (!context) {
        return;
      }

      if (context.state === "suspended") {
        context.resume().catch(() => {});
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      const durationSec = durationMs / 1000;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + durationSec + 0.01);
    } catch {
      // Silent fallback if audio is blocked.
    }
  }

  function playCorrect() {
    playTone(880, 90, "sine", 0.09);
    setTimeout(() => playTone(1180, 110, "triangle", 0.06), 80);
  }

  function playWrong() {
    playTone(240, 120, "triangle", 0.08);
    setTimeout(() => playTone(180, 150, "sawtooth", 0.06), 90);
  }

  async function destroy() {
    if (!audioContext) {
      return;
    }

    try {
      await audioContext.close();
    } catch {
      // Ignore close errors.
    }

    audioContext = null;
  }

  return {
    playCorrect,
    playWrong,
    destroy
  };
}

export function createFeedbackKit(config = {}) {
  const mountRoot = config.mountRoot || document.body;
  const ConfettiGenerator = resolveConfettiGenerator();
  const tones = createToneMachine();
  const defaultCanvasId = `tc-confetti-canvas-${Math.random().toString(36).slice(2, 9)}`;

  let canvasNode = null;
  let confetti = null;
  let stopTimer = null;

  function ensureCanvas() {
    if (canvasNode) {
      return canvasNode;
    }

    canvasNode = document.createElement("canvas");
    canvasNode.id = config.canvasId || defaultCanvasId;
    canvasNode.className = "tc-confetti-canvas";
    mountRoot.appendChild(canvasNode);

    return canvasNode;
  }

  function stopConfetti() {
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }

    if (confetti && typeof confetti.clear === "function") {
      confetti.clear();
    }

    confetti = null;
  }

  function celebrate(options = {}) {
    if (!ConfettiGenerator) {
      return;
    }

    stopConfetti();

    const canvas = ensureCanvas();
    const durationMs = Number.isFinite(options.durationMs) ? options.durationMs : 1300;
    const particleCount = Number.isFinite(options.particleCount) ? options.particleCount : 160;

    confetti = new ConfettiGenerator({
      target: canvas.id,
      max: particleCount,
      size: 1.2,
      animate: true,
      props: ["circle", "square", "triangle", "line"],
      colors: [
        [20, 184, 166],
        [249, 115, 22],
        [59, 130, 246],
        [16, 185, 129]
      ],
      clock: 28,
      rotate: true,
      start_from_edge: true,
      respawn: true
    });

    confetti.render();
    stopTimer = setTimeout(stopConfetti, durationMs);
  }

  function playCorrect() {
    tones.playCorrect();
  }

  function playWrong() {
    tones.playWrong();
  }

  function celebratePerfectRun() {
    playCorrect();
    celebrate({
      durationMs: 1700,
      particleCount: 220
    });
  }

  async function destroy() {
    stopConfetti();
    await tones.destroy();

    if (canvasNode && canvasNode.parentNode) {
      canvasNode.parentNode.removeChild(canvasNode);
    }

    canvasNode = null;
  }

  return {
    playCorrect,
    playWrong,
    celebrate,
    celebratePerfectRun,
    destroy
  };
}
