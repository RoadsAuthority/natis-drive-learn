const TEST_QUESTION_LIMIT = Number(process.env.TEST_QUESTION_LIMIT ?? 70);

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function normalizeOptions(optionsJson) {
  if (Array.isArray(optionsJson)) {
    return optionsJson;
  }
  if (typeof optionsJson === "string") {
    try {
      const parsed = JSON.parse(optionsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatQuestionForClient(row) {
  const options = shuffleArray(normalizeOptions(row.options_json));
  return {
    id: row.id,
    question: row.question_text,
    options,
    imageUrl: row.image_url ?? null,
  };
}

export { TEST_QUESTION_LIMIT, shuffleArray, normalizeOptions, formatQuestionForClient };
