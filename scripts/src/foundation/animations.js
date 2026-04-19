import { animate, stagger } from "animejs";

export function animatePillPulse(element) {
  animate(element, {
    scale: [1, 1.1, 1],
    rotate: [0, -2, 2, 0],
    duration: 280
  });
}

export function animateScreenReveal(screenElement) {
  animate(screenElement, {
    opacity: [0.65, 1],
    duration: 240
  });

  const animatedNodes = screenElement.querySelectorAll(".fade-in");
  if (!animatedNodes.length) {
    return;
  }

  animate(animatedNodes, {
    opacity: [0, 1],
    translateY: [14, 0],
    scale: [0.98, 1],
    duration: 320,
    delay: stagger(42)
  });
}

export function animateQuestionIn(questionNode, optionNodes) {
  animate(questionNode, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 260
  });

  animate(optionNodes, {
    opacity: [0, 1],
    translateY: [14, 0],
    scale: [0.98, 1],
    delay: stagger(62),
    duration: 320
  });
}

export function animateCorrectOption(buttonNode) {
  animate(buttonNode, {
    scale: [1, 1.04, 1],
    duration: 250
  });
}

export function animateWrongOption(buttonNode) {
  animate(buttonNode, {
    translateX: [0, -7, 7, -4, 2, 0],
    duration: 360
  });
}

export function animateStreakReveal(streakNode) {
  animate(streakNode, {
    opacity: [0, 1],
    scale: [0.92, 1],
    duration: 300
  });
}

export function animateProgressTo(barNode, percent) {
  animate(barNode, {
    width: ["0%", `${percent}%`],
    duration: 540
  });
}

export function animateResultIntro(nodes) {
  animate(nodes, {
    opacity: [0, 1],
    translateY: [12, 0],
    delay: stagger(85),
    duration: 320
  });
}

export function animateFeedbackReveal(feedbackItems, nextButtonNode) {
  animate(feedbackItems, {
    opacity: [0, 1],
    translateY: [8, 0],
    delay: stagger(45),
    duration: 240
  });

  if (!nextButtonNode) {
    return;
  }

  animate(nextButtonNode, {
    opacity: [0, 1],
    translateY: [10, 0],
    duration: 220,
    delay: 120
  });
}
