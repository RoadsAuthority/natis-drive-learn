export type QuestionOption = {
  id: string;
  text: string;
};

export type TestQuestion = {
  id: string;
  question: string;
  options: QuestionOption[];
  imageUrl?: string | null;
};
