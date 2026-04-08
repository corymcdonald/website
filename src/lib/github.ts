export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface UserCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface AggregatedDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface AggregatedResult {
  days: AggregatedDay[];
  total: number;
  error?: boolean;
}

const GITHUB_USERS = ["corymcdonald", "bark-cmcdonald", "unrivaled-cmcdonald"];

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export function computeLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function aggregateCalendars(calendars: UserCalendar[]): AggregatedResult {
  const dayCounts = new Map<string, number>();

  for (const calendar of calendars) {
    for (const week of calendar.weeks) {
      for (const day of week.contributionDays) {
        dayCounts.set(day.date, (dayCounts.get(day.date) ?? 0) + day.contributionCount);
      }
    }
  }

  const total = Array.from(dayCounts.values()).reduce((s, c) => s + c, 0);
  const max = Math.max(0, ...dayCounts.values());

  const days: AggregatedDay[] = Array.from(dayCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      count,
      level: computeLevel(count, max),
    }));

  return { days, total };
}

async function fetchUserCalendar(
  login: string,
  token: string
): Promise<UserCalendar> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "corywmcdonald-portfolio",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${login}`);
  }

  const json = (await response.json()) as {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: UserCalendar;
        };
      };
    };
  };

  return json.data.user.contributionsCollection.contributionCalendar;
}

export interface MultiYearResult {
  trailing: AggregatedResult;
  years: Record<string, AggregatedResult>;
  error?: boolean;
}

function buildMultiYearQuery(years: number[]): string {
  const fragments = years
    .map(
      (year) =>
        `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }`
    )
    .join("\n");

  return `query($login: String!) { user(login: $login) {
    trailing: contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    ${fragments}
  } }`;
}

interface UserMultiYearResult {
  trailing: UserCalendar;
  years: Record<number, UserCalendar>;
}

async function fetchUserMultiYearCalendars(
  login: string,
  token: string,
  years: number[]
): Promise<UserMultiYearResult> {
  const query = buildMultiYearQuery(years);
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "corywmcdonald-portfolio",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${login}`);
  }

  const json = (await response.json()) as {
    data: {
      user: Record<string, { contributionCalendar: UserCalendar }>;
    };
  };

  const perYear: Record<number, UserCalendar> = {};
  for (const year of years) {
    const entry = json.data.user[`y${year}`];
    if (entry?.contributionCalendar) {
      perYear[year] = entry.contributionCalendar;
    }
  }

  return {
    trailing: json.data.user.trailing.contributionCalendar,
    years: perYear,
  };
}

export async function getMultiYearContributions(env: {
  GITHUB_TOKEN: string;
}): Promise<MultiYearResult> {
  try {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const cacheKey = "https://internal.cache/contributions-multiyear-v1";
    const cache = (typeof caches !== "undefined" ? caches : null)?.default;

    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached.json() as Promise<MultiYearResult>;
      }
    }

    const allUserYears = await Promise.all(
      GITHUB_USERS.map((login) =>
        fetchUserMultiYearCalendars(login, env.GITHUB_TOKEN, years)
      )
    );

    const trailingCalendars = allUserYears.map((u) => u.trailing);
    const result: MultiYearResult = {
      trailing: aggregateCalendars(trailingCalendars),
      years: {},
    };

    for (const year of years) {
      const calendarsForYear: UserCalendar[] = [];
      for (const userYears of allUserYears) {
        if (userYears.years[year]) {
          calendarsForYear.push(userYears.years[year]);
        }
      }
      if (calendarsForYear.length > 0) {
        result.years[year] = aggregateCalendars(calendarsForYear);
      }
    }

    if (cache) {
      const res = new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
      await cache.put(cacheKey, res.clone());
    }

    return result;
  } catch {
    return { trailing: { days: [], total: 0 }, years: {}, error: true };
  }
}

export async function getAggregatedContributions(env: {
  GITHUB_TOKEN: string;
}): Promise<AggregatedResult> {
  try {
    const cacheKey = "https://internal.cache/contributions-v1";
    const cache = (typeof caches !== "undefined" ? caches : null)?.default;

    if (cache) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached.json() as Promise<AggregatedResult>;
      }
    }

    const calendars = await Promise.all(
      GITHUB_USERS.map((login) => fetchUserCalendar(login, env.GITHUB_TOKEN))
    );

    const result = aggregateCalendars(calendars);

    if (cache) {
      const response = new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      });
      await cache.put(cacheKey, response.clone());
    }

    return result;
  } catch (e) {
    return { days: [], total: 0, error: true };
  }
}
