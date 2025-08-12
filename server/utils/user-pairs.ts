import { shuffle } from "es-toolkit";

/**
 * Creates pairs of users for weekly random duels based on their stitches rate.
 * @param users The list of users to pair.
 * @returns The list of user pairs.
 */
export function createUserPairs(users: readonly (UserIdAndFullname & Pick<UserSettings, "stitchesRate">)[]) {
  if (users.length < 2) throw new Error("Not enough users to create pairs.");

  // Group users by their stitches rate.
  const usersGroupedByStitchesRate = Object.groupBy(users, (user) => user.stitchesRate);

  const pairs = [];

  let leftovers: (typeof users)[number][] = [];
  for (const group of Object.values(usersGroupedByStitchesRate)) {
    let users = shuffle(group);

    if (users.length === 1) {
      // If there's only one user in this group, add to leftovers.
      leftovers.push(users[0]!);
      continue;
    }

    if (leftovers.length) {
      // Add any leftover users to this group if there are any.
      users = [...users, ...leftovers];
      leftovers = [];
    }

    while (users.length >= 2) {
      // Create pairs.
      pairs.push([users.pop()!, users.pop()!]);
    }

    if (users.length) {
      // If there's a user left, add to the last pair.
      pairs.at(-1)!.push(users.pop()!);
    }
  }

  // Handle remaining leftovers.
  if (leftovers.length >= 2) {
    // If there are two or more leftovers, we create a new pair.
    pairs.push(leftovers);
  } else if (leftovers.length === 1) {
    const lastPair = pairs.pop()!;

    if (lastPair.length === 2) {
      // If the last pair has only two users, add the leftover user to it.
      lastPair.push(leftovers[0]!);
    } else if (lastPair.length === 3) {
      // If the last pair has three users, create a new pair with one of them with the leftover user.
      pairs.push([lastPair.pop()!, leftovers[0]!]);
    }

    pairs.push(lastPair);
  }

  return pairs;
}
