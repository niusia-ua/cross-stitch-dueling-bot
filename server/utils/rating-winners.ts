/**
 * Return the winners from a rating list.
 *
 * Winners are the top 3 positions, plus anyone with the same number of wins as any of those positions.
 *
 * @param rating The rating list sorted by total duels won (descending).
 * @returns The list of winners.
 */
export function getRatingWinners<T extends { totalDuelsWon: number }>(rating: readonly T[]): T[] {
  if (rating.length === 0) return [];
  if (rating.length <= 3) return [...rating];

  // Get the win counts of the top 3 positions.
  const winCounts = new Set<number>();
  for (let i = 0; i < 3; i++) {
    winCounts.add(rating[i]!.totalDuelsWon);
  }

  // Include anyone who has any of those win counts.
  return rating.filter((record) => winCounts.has(record.totalDuelsWon));
}
