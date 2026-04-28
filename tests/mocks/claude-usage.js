export function createClaudeUsageResponse({ utilization, resetsAt, sevenDay }) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      five_hour: {
        utilization,
        resets_at: resetsAt
      },
      ...(sevenDay ? { seven_day: sevenDay } : {})
    })
  };
}

export function createClaudeUsageFetchMock(...states) {
  return states.map((state) => createClaudeUsageResponse(state));
}