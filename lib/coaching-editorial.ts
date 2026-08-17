import type { SkillKey } from "@/types/models";

export interface CoachingEditorialCard {
  id: string;
  label: string;
  title: string;
  body: string;
  skill?: SkillKey;
  icon: "visibility" | "swap-horiz" | "shield" | "speed";
}

/** Small, bundled teaching cards—no network call or AI dependency on the sideline. */
export const COACHING_EDITORIAL_CARDS: readonly CoachingEditorialCard[] = [
  { id: "scan", label: "TOUCHLINE NOTE", title: "Scan before the pass arrives", body: "Pause the clip or freeze the next drill. Ask: what did you see before your first touch?", skill: "receiving", icon: "visibility" },
  { id: "support", label: "TEAM HABIT", title: "Give the ball carrier two pictures", body: "One support option underneath and one beyond. Count the options, not just the passes.", skill: "passing", icon: "swap-horiz" },
  { id: "delay", label: "DEFENDING CUE", title: "Delay first, then win it", body: "A good recovery run buys teammates time. Reward the player who slows the next action.", skill: "defending", icon: "shield" },
  { id: "change-pace", label: "1V1 DETAIL", title: "Change speed after the move", body: "The move creates a gap; the acceleration makes it matter. Work in short, repeatable bursts.", skill: "dribbling", icon: "speed" },
];

export function editorialForSkill(skill?: SkillKey): CoachingEditorialCard {
  return COACHING_EDITORIAL_CARDS.find((card) => card.skill === skill) ?? COACHING_EDITORIAL_CARDS[0];
}
