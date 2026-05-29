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

async function gradeAnswersByQuestionIds(sql, answers) {
  const entries = Object.entries(answers);
  if (!entries.length) {
    return { score: 0, total: 0, percentage: 0, passed: false };
  }

  let score = 0;
  for (const [questionId, choice] of entries) {
    const rows = await sql`
      select correct_answer
      from question_bank
      where id = ${questionId}
      limit 1
    `;
    const expected = String(rows[0]?.correct_answer ?? "").toLowerCase();
    const chosen = String(choice ?? "").toLowerCase();
    if (expected && chosen === expected) {
      score += 1;
    }
  }

  const total = entries.length;
  const percentage = (score / total) * 100;
  return { score, total, percentage, passed: percentage >= 80 };
}

export {
  TEST_QUESTION_LIMIT,
  shuffleArray,
  normalizeOptions,
  formatQuestionForClient,
  gradeAnswersByQuestionIds,
};
