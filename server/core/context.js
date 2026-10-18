const terms = (value) =>
  new Set(value.toLocaleLowerCase("sv").match(/[\p{L}\p{N}]{3,}/gu) || []);
export function relevant(items, query, limit = 6) {
  const words = terms(query);
  return items
    .map((item) => ({
      item,
      score: [...terms(item.content || "")].filter((word) => words.has(word))
        .length,
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}
export function contextFor(store, channel, query, businessId) {
  // The model role is fixed by the server route; request bodies cannot grant access.
  const own = store
    .all("chatMessage")
    .filter(
      (row) =>
        row.channel === channel && ["user", "assistant"].includes(row.role),
    )
    .reverse();
  const legacy =
    channel === "garon"
      ? store
          .all("message")
          .filter((row) => ["user", "assistant"].includes(row.role))
          .reverse()
      : [];
  const memories = relevant(
    store
      .all("memory")
      .filter(
        (row) =>
          (channel === "garon" || row.visibility === "shared") &&
          (!row.businessId || row.businessId === businessId),
      ),
    query,
  ).map((row) => ({
    id: row.id,
    content: row.content.slice(0, 1500),
    source: row.source,
    verified: row.verified,
  }));
  const managers =
    channel === "garon"
      ? (/sammanfatta.*(mellanchef|ledning|chatgpt|claude)/i.test(query)
          ? store
              .all("chatMessage")
              .filter(
                (row) => row.channel !== "garon" && row.role === "assistant",
              )
              .slice(0, 4)
          : relevant(
              store
                .all("chatMessage")
                .filter(
                  (row) => row.channel !== "garon" && row.role === "assistant",
                ),
              query,
              4,
            )
        ).map((row) => ({
          channel: row.channel,
          content: row.content.slice(0, 1200),
        }))
      : [];
  const business = businessId ? store.get("business", businessId) : null;
  return {
    history: [...legacy, ...own]
      .slice(-10)
      .map((row) => ({ role: row.role, content: row.content.slice(0, 6000) })),
    memories,
    managers,
    business: business
      ? { name: business.name, description: business.description }
      : null,
  };
}
