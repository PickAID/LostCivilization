/**
 * GitHub integration utilities for charts
 */

import type { GitHubCommit } from "@utils/content/types";

export interface FetchAllCommitsResult {
    success: boolean;
    commits: GitHubCommit[];
    error?: string;
    rateLimited: boolean;
}

export interface FetchAllCommitsOptions {
    daysToFetch?: number;
}

function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function shiftLocalDays(date: Date, deltaDays: number): Date {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + deltaDays);
    return startOfLocalDay(shifted);
}

function getLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getOldestContributionDate(daysToFetch: number): Date {
    const safeDays = Math.max(1, daysToFetch);
    return shiftLocalDays(startOfLocalDay(new Date()), -(safeDays - 1));
}

export async function fetchAllCommits(
    username: string,
    repoName: string,
    options?: FetchAllCommitsOptions,
): Promise<GitHubCommit[]> {
    const result = await githubApi.fetchAllCommits(username, repoName, options);
    return result.commits;
}

export const githubApi = {
    async fetchAllCommits(
        username: string,
        repoName: string,
        options?: FetchAllCommitsOptions,
    ): Promise<FetchAllCommitsResult> {
        const allCommits: GitHubCommit[] = [];
        let page = 1;
        let rateLimited = false;
        const since = options?.daysToFetch
            ? `&since=${encodeURIComponent(
                  getOldestContributionDate(options.daysToFetch).toISOString(),
              )}`
            : "";

        while (true) {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${username}/${repoName}/commits?page=${page}&per_page=100${since}`,
                );

                if (!response.ok) {
                    rateLimited = response.status === 403 || response.status === 429;
                    return {
                        success: false,
                        commits: allCommits,
                        error: `GitHub API error: ${response.status}`,
                        rateLimited,
                    };
                }

                const commits: GitHubCommit[] = await response.json();
                if (commits.length === 0) {
                    break;
                }

                allCommits.push(...commits);
                page++;
            } catch (error) {
                return {
                    success: false,
                    commits: allCommits,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown GitHub API error",
                    rateLimited,
                };
            }
        }

        return {
            success: true,
            commits: allCommits,
            rateLimited,
        };
    },
};

export function processContributions(
    commits: GitHubCommit[],
    daysToFetch: number = 30,
): number[] {
    const contributionsMap: Record<string, number> = {};
    const oldestDate = getOldestContributionDate(daysToFetch);

    commits.forEach((commit) => {
        const commitDate = new Date(commit.commit.author.date);
        if (commitDate >= oldestDate) {
            const dateString = getLocalDateKey(commitDate);
            contributionsMap[dateString] =
                (contributionsMap[dateString] || 0) + 1;
        }
    });

    return Array.from({ length: daysToFetch }, (_, index) => {
        const date = shiftLocalDays(oldestDate, index);
        return contributionsMap[getLocalDateKey(date)] || 0;
    });
}

export function getTotalContributions(contributions: number[]): number {
    return contributions.reduce((sum, value) => sum + value, 0);
}

export const commitProcessor = {
    processContributions,
    getTotalContributions,
};

export function generateSparklineOptions(
    contributions: number[],
    isDark: boolean = false,
    options: {
        smooth?: boolean;
        lineWidth?: number;
        fill?: boolean;
    } = {},
) {
    const { smooth = true, lineWidth = 2, fill = true } = options;

    const gradientColors = isDark
        ? ["#4A148C", "#6A1B9A", "#8E24AA"]
        : ["#1565C0", "#1976D2", "#2196F3"];

    return {
        grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        },
        xAxis: {
            type: "category",
            show: false,
            boundaryGap: false,
            data: Array.from({ length: contributions.length }, (_, i) => i),
        },
        yAxis: {
            type: "value",
            show: false,
        },
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "cross",
                label: {
                    backgroundColor: "#6a7985",
                },
            },
            formatter: (params: Array<{ dataIndex: number; value: number }>) => {
                const dataIndex = params[0].dataIndex;
                const date = new Date();
                date.setDate(
                    date.getDate() - (contributions.length - 1 - dataIndex),
                );
                return `${date.toLocaleDateString()}: ${params[0].value} commits`;
            },
        },
        series: [
            {
                type: "line",
                data: contributions,
                showSymbol: false,
                smooth,
                lineStyle: {
                    width: lineWidth,
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: gradientColors.map((color, index) => ({
                            offset: index / (gradientColors.length - 1),
                            color,
                        })),
                    },
                },
                areaStyle: fill
                    ? {
                          color: {
                              type: "linear",
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [
                                  {
                                      offset: 0,
                                      color: `${gradientColors[0]}80`,
                                  },
                                  {
                                      offset: 1,
                                      color: `${gradientColors[gradientColors.length - 1]}20`,
                                  },
                              ],
                          },
                      }
                    : undefined,
            },
        ],
    };
}

export function getRecentContributionDates(daysToFetch: number): Date[] {
    const oldestDate = getOldestContributionDate(daysToFetch);
    return Array.from({ length: daysToFetch }, (_, index) =>
        shiftLocalDays(oldestDate, index),
    );
}

export const chartOptions = {
    generateSparklineOptions,
};
