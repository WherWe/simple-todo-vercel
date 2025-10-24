# Taglines Configuration

This file controls the witty taglines shown in the todoish app header and featured quote banner.

## How It Works

Each tagline has three properties:

```json
{
  "text": "The tagline text",
  "rank": 1,
  "active": true
}
```

### Properties

- **text**: The tagline content (what users see)
- **rank**: How often this tagline appears (using 1's for easy ranking)
- **active**: Whether this tagline should be shown at all

## Ranking System (Using 1's)

The rank determines how frequently a tagline appears:

- **0** = Inactive (never shown) - same as `"active": false`
- **1** = Normal frequency (appears once in the pool)
- **11** = 11x more likely to appear than rank 1
- **111** = 111x more likely to appear than rank 1
- **1111** = 1111x more likely to appear than rank 1

### How to Rank

**Each time you like a tagline, add another "1" to its rank:**

```json
// Start
{ "text": "Your thoughts. Organized-ish.", "rank": 1 }

// You like it? Add a 1
{ "text": "Your thoughts. Organized-ish.", "rank": 11 }

// Love it even more? Add another 1
{ "text": "Your thoughts. Organized-ish.", "rank": 111 }

// This is THE tagline? Add more 1's!
{ "text": "Your thoughts. Organized-ish.", "rank": 1111 }
```

## Examples

```json
{
  "taglines": [
    {
      "text": "Todoish: because done-ish is good enough.",
      "rank": 1111,
      "active": true
    },
    {
      "text": "Like Todoist, but slightly less judgmental.",
      "rank": 111,
      "active": true
    },
    {
      "text": "Less list. More life.",
      "rank": 11,
      "active": true
    },
    {
      "text": "Your procrastination, now neatly itemized.",
      "rank": 1,
      "active": true
    },
    {
      "text": "Old tagline we don't use anymore",
      "rank": 0,
      "active": false
    }
  ]
}
```

## Quick Actions

### Disable a Tagline

Set `"active": false` or `"rank": 0`

### Make a Tagline Appear More

Add more 1's to the rank: `1` → `11` → `111` → `1111`

### Make a Tagline Appear Less

Remove 1's from the rank: `111` → `11` → `1`

### Add a New Tagline

Add a new object with `"rank": 1` and `"active": true`

## Tips

- Start new taglines at rank `1` to test them
- If users love a tagline, keep adding 1's (up to 1111 for max frequency)
- Use `"active": false` to temporarily disable taglines without deleting them
- The system automatically weights the random selection based on ranks
