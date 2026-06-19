import type { GameShowData, GameShowType } from "./gameShowTypes";

export function defaultDataForType(type: GameShowType): GameShowData {
  switch (type) {
    case "grid":
      return {
        categories: [
          {
            name: "Category 1",
            clues: [{ value: 100, question: "", answer: "" }],
          },
        ],
      };
    case "wheel":
      return {
        rounds: [{ category: "Category", phrase: "", hint: "" }],
      };
    case "feud":
      return {
        rounds: [{ prompt: "", answers: [{ text: "", points: 10 }] }],
      };
    case "race":
      return {
        questions: [{ question: "", choices: ["", "", "", ""], correctIndex: 0, points: 100 }],
      };
    case "memory":
      return {
        pairs: [{ term: "", definition: "" }],
      };
  }
}
