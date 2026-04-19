export function shuffle(input) {
  const result = [...input];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export function sampleWithoutReplacement(values, count, excluded = new Set()) {
  const filtered = values.filter((value) => !excluded.has(value));
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, Math.max(0, count));
}

export function pickRandom(values) {
  if (!values.length) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}
