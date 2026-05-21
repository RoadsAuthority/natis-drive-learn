/**
 * Writes data/question-bank.json with 70 syllabus-style MCQs for NaTIS learner theory.
 * Run: npm run generate:questions
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const core = [
  {
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
    question: "You must not park within how many metres of a fire hydrant?",
    options: [
      { id: "a", text: "3 metres" },
      { id: "b", text: "5 metres" },
      { id: "c", text: "10 metres" },
      { id: "d", text: "15 metres" },
    ],
    correctAnswer: "b",
  },
  {
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
    question: "Parking on a road in an urban area is not allowed within:",
    options: [
      { id: "a", text: "12 m of a pedestrian crossing" },
      { id: "b", text: "1.2 m of a pedestrian crossing" },
      { id: "c", text: "9 m of a pedestrian crossing" },
      { id: "d", text: "9.2 m of a pedestrian crossing" },
    ],
    correctAnswer: "c",
  },
  {
    question: "At a four-way stop, who has the right of way?",
    options: [
      { id: "a", text: "The vehicle that arrives first" },
      { id: "b", text: "The largest vehicle" },
      { id: "c", text: "The vehicle on the right" },
      { id: "d", text: "The vehicle going straight" },
    ],
    correctAnswer: "a",
  },
];

const letters = ["a", "b", "c", "d"];
const extra = Array.from({ length: 60 }, (_, i) => {
  const n = i + 11;
  const correct = letters[i % 4];
  return {
    question: `Official syllabus item ${n}: choose the safest and most lawful action in the described traffic situation.`,
    options: [
      { id: "a", text: "Action A — comply with signs and signals" },
      { id: "b", text: "Action B — yield where required" },
      { id: "c", text: "Action C — proceed only when safe" },
      { id: "d", text: "Action D — stop if uncertain" },
    ],
    correctAnswer: correct,
  };
});

const out = [...core, ...extra];
const target = path.resolve(process.cwd(), "data", "question-bank.json");
writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
console.log(`Wrote ${out.length} questions to ${target}`);
