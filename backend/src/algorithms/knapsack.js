function knapsack(items, capacity) {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const weight = Math.round(item.weight || item.consommation_requise || 0);
    const value = item.value || item.priorite || 0;

    for (let w = 0; w <= capacity; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  const result = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    const item = items[i - 1];
    const weight = Math.round(item.weight || item.consommation_requise || 0);

    if (dp[i][w] !== dp[i - 1][w]) {
      result.push(item);
      w -= weight;
    }
  }

  return result;
}

module.exports = knapsack;