import { describe, it, expect } from "vitest";
import { aggregateCalendars, type UserCalendar } from "./github";

function makeCalendar(
  days: Array<{ date: string; contributionCount: number }>
): UserCalendar {
  // Group days into weeks of 7
  const weeks: UserCalendar["weeks"] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({ contributionDays: days.slice(i, i + 7) });
  }
  return {
    totalContributions: days.reduce((s, d) => s + d.contributionCount, 0),
    weeks,
  };
}

describe("aggregateCalendars", () => {
  it("sums contributions across users for the same dates", () => {
    const userA = makeCalendar([
      { date: "2025-01-01", contributionCount: 3 },
      { date: "2025-01-02", contributionCount: 0 },
    ]);
    const userB = makeCalendar([
      { date: "2025-01-01", contributionCount: 2 },
      { date: "2025-01-02", contributionCount: 5 },
    ]);

    const result = aggregateCalendars([userA, userB]);

    expect(result.total).toBe(10);
    expect(result.days).toHaveLength(2);

    const jan1 = result.days.find((d) => d.date === "2025-01-01")!;
    expect(jan1.count).toBe(5);

    const jan2 = result.days.find((d) => d.date === "2025-01-02")!;
    expect(jan2.count).toBe(5);
  });

  it("includes dates that only appear in one user", () => {
    const userA = makeCalendar([
      { date: "2025-03-01", contributionCount: 4 },
    ]);
    const userB = makeCalendar([
      { date: "2025-03-02", contributionCount: 1 },
    ]);

    const result = aggregateCalendars([userA, userB]);

    expect(result.total).toBe(5);
    expect(result.days).toHaveLength(2);
    expect(result.days.find((d) => d.date === "2025-03-01")!.count).toBe(4);
    expect(result.days.find((d) => d.date === "2025-03-02")!.count).toBe(1);
  });

  it("assigns level 0 to days with zero contributions", () => {
    const calendar = makeCalendar([
      { date: "2025-06-01", contributionCount: 0 },
      { date: "2025-06-02", contributionCount: 10 },
    ]);

    const result = aggregateCalendars([calendar]);

    expect(result.days.find((d) => d.date === "2025-06-01")!.level).toBe(0);
    expect(result.days.find((d) => d.date === "2025-06-02")!.level).toBe(4);
  });

  it("buckets levels correctly across a range", () => {
    const calendar = makeCalendar([
      { date: "2025-07-01", contributionCount: 0 },
      { date: "2025-07-02", contributionCount: 1 },
      { date: "2025-07-03", contributionCount: 3 },
      { date: "2025-07-04", contributionCount: 6 },
      { date: "2025-07-05", contributionCount: 10 },
    ]);

    const result = aggregateCalendars([calendar]);
    const levels = result.days.map((d) => d.level);

    // 0 -> level 0
    // 1/10 = 10% -> level 1 (1-25%)
    // 3/10 = 30% -> level 2 (26-50%)
    // 6/10 = 60% -> level 3 (51-75%)
    // 10/10 = 100% -> level 4 (76-100%)
    expect(levels).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns days sorted by date ascending", () => {
    const calendar = makeCalendar([
      { date: "2025-02-03", contributionCount: 1 },
      { date: "2025-02-01", contributionCount: 1 },
      { date: "2025-02-02", contributionCount: 1 },
    ]);

    const result = aggregateCalendars([calendar]);
    const dates = result.days.map((d) => d.date);

    expect(dates).toEqual(["2025-02-01", "2025-02-02", "2025-02-03"]);
  });

  it("handles empty input", () => {
    const result = aggregateCalendars([]);
    expect(result.total).toBe(0);
    expect(result.days).toEqual([]);
  });
});
