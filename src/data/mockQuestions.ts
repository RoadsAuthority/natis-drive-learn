export interface Question {
  id: number;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: "What is the speed limit in urban areas in Namibia?",
    options: [
      { id: "a", text: "60 km/h" },
      { id: "b", text: "80 km/h" },
      { id: "c", text: "100 km/h" },
      { id: "d", text: "120 km/h" },
    ],
    correctAnswer: "a",
  },
  {
    id: 2,
    question: "When approaching a pedestrian crossing, you must:",
    options: [
      { id: "a", text: "Speed up to cross quickly" },
      { id: "b", text: "Slow down and give way to pedestrians" },
      { id: "c", text: "Honk your horn" },
      { id: "d", text: "Flash your lights" },
    ],
    correctAnswer: "b",
  },
  {
    id: 3,
    question: "A red traffic light means:",
    options: [
      { id: "a", text: "Slow down" },
      { id: "b", text: "Proceed with caution" },
      { id: "c", text: "Stop completely" },
      { id: "d", text: "Speed up to clear the intersection" },
    ],
    correctAnswer: "c",
  },
  {
    id: 4,
    question: "What does a yellow traffic light indicate?",
    options: [
      { id: "a", text: "Stop if safe to do so" },
      { id: "b", text: "Go faster" },
      { id: "c", text: "Turn left" },
      { id: "d", text: "Reverse" },
    ],
    correctAnswer: "a",
  },
  {
    id: 5,
    question: "The minimum following distance in good conditions should be:",
    options: [
      { id: "a", text: "1 second" },
      { id: "b", text: "2 seconds" },
      { id: "c", text: "3 seconds" },
      { id: "d", text: "5 seconds" },
    ],
    correctAnswer: "c",
  },
  {
    id: 6,
    question: "You must not park within how many meters of a fire hydrant?",
    options: [
      { id: "a", text: "3 meters" },
      { id: "b", text: "5 meters" },
      { id: "c", text: "10 meters" },
      { id: "d", text: "15 meters" },
    ],
    correctAnswer: "b",
  },
  {
    id: 7,
    question: "When driving in rain, you should:",
    options: [
      { id: "a", text: "Drive faster to get home quickly" },
      { id: "b", text: "Use cruise control" },
      { id: "c", text: "Reduce speed and increase following distance" },
      { id: "d", text: "Turn off headlights" },
    ],
    correctAnswer: "c",
  },
  {
    id: 8,
    question: "A solid white line on the road means:",
    options: [
      { id: "a", text: "You may overtake" },
      { id: "b", text: "No overtaking allowed" },
      { id: "c", text: "Parking is allowed" },
      { id: "d", text: "Speed up" },
    ],
    correctAnswer: "b",
  },
  {
    id: 9,
    question: "Parking on a road in an urban area is not allowed within:",
    options: [
      { id: "a", text: "12m of a pedestrian crossing" },
      { id: "b", text: "1.2m of a pedestrian crossing" },
      { id: "c", text: "9m of a pedestrian crossing" },
      { id: "d", text: "9.2m of a pedestrian crossing" },
    ],
    correctAnswer: "c",
  },
  {
    id: 10,
    question: "At a four-way stop, who has the right of way?",
    options: [
      { id: "a", text: "The vehicle that arrives first" },
      { id: "b", text: "The largest vehicle" },
      { id: "c", text: "The vehicle on the right" },
      { id: "d", text: "The vehicle going straight" },
    ],
    correctAnswer: "a",
  },
  // Additional questions to reach 70
  ...Array.from({ length: 60 }, (_, i) => ({
    id: i + 11,
    question: `Sample question ${i + 11} about road safety and traffic rules.`,
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
      { id: "c", text: "Option C" },
      { id: "d", text: "Option D" },
    ],
    correctAnswer: "a",
  })),
];
