import taglinesData from "../data/taglines.json";

export interface Tagline {
  text: string;
  rank: number;
  active: boolean;
}

interface TaglinesData {
  taglines: Tagline[];
}

/**
 * Get all active taglines with weighted probability based on rank
 * Rank system:
 * - 0 = inactive (never shown)
 * - 1 = weight of 1 (shown once in pool)
 * - 11 = weight of 2 (shown 2 times in pool) - count the number of 1's
 * - 111 = weight of 3 (shown 3 times in pool)
 * - 1111 = weight of 4 (shown 4 times in pool)
 *
 * Weight = count of "1" digits in the rank number
 */
export function getWeightedTaglines(): string[] {
  const weighted: string[] = [];
  const data = taglinesData as TaglinesData;

  data.taglines.forEach((tagline: Tagline) => {
    // Skip inactive taglines (rank 0 or active: false)
    if (!tagline.active || tagline.rank === 0) {
      return;
    }

    // Count the number of 1's in the rank to determine weight
    const weight = tagline.rank.toString().split("1").length - 1;

    // Add the tagline multiple times based on weight (count of 1's)
    for (let i = 0; i < weight; i++) {
      weighted.push(tagline.text);
    }
  });

  return weighted;
}

/**
 * Get a random tagline with weighted probability (excludes the top-ranked official tagline)
 */
export function getRandomTagline(): string {
  const data = taglinesData as TaglinesData;
  const topTagline = getTopTagline();

  const weighted: string[] = [];

  data.taglines.forEach((tagline: Tagline) => {
    // Skip inactive taglines, rank 0, AND the top-ranked official tagline
    if (!tagline.active || tagline.rank === 0 || tagline.text === topTagline) {
      return;
    }

    // Count the number of 1's in the rank to determine weight
    const weight = tagline.rank.toString().split("1").length - 1;

    // Add the tagline multiple times based on weight (count of 1's)
    for (let i = 0; i < weight; i++) {
      weighted.push(tagline.text);
    }
  });

  if (weighted.length === 0) {
    return "Your thoughts. Organized-ish."; // Fallback
  }

  const randomIndex = Math.floor(Math.random() * weighted.length);
  return weighted[randomIndex];
}

/**
 * Get the top-ranked (most weighted) active tagline for official branding
 * Returns the tagline with the most 1's in its rank (highest weight)
 */
export function getTopTagline(): string {
  const data = taglinesData as TaglinesData;

  // Find active taglines and sort by weight (count of 1's, highest first)
  const activeTaglines = data.taglines
    .filter((t: Tagline) => t.active && t.rank > 0)
    .sort((a: Tagline, b: Tagline) => {
      const weightA = a.rank.toString().split("1").length - 1;
      const weightB = b.rank.toString().split("1").length - 1;
      return weightB - weightA;
    });

  if (activeTaglines.length === 0) {
    return "Your thoughts. Organized-ish."; // Fallback
  }

  return activeTaglines[0].text;
}

/**
 * Get all taglines (for display/editing purposes)
 */
export function getAllTaglines(): Tagline[] {
  const data = taglinesData as TaglinesData;
  return data.taglines;
}
