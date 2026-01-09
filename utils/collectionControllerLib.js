exports.updateRecentUpdates = (recentUpdates, card) => {
  if (recentUpdates.length == 0) return [card];

  for (let i = 0; i < recentUpdates.length; i++) {
    const recentDate = new Date(recentUpdates[i].value.priceHistory[0][0]);
    const cardDate = new Date(card.value.priceHistory[0][0]);
    if (cardDate > recentDate) {
      recentUpdates.splice(i, 0, card);
      return recentUpdates.slice(0, 5);
    }
  }

  if (recentUpdates.length < 5) return [...recentUpdates, card];

  return recentUpdates;
};

exports.updateStaleUpdates = (staleUpdates, card) => {
  if (staleUpdates.length == 0) return [card];

  for (let i = 0; i < staleUpdates.length; i++) {
    const staleDate = new Date(staleUpdates[i].value.priceHistory[0][0]);
    const cardDate = new Date(card.value.priceHistory[0][0]);
    if (cardDate < staleDate) {
      staleUpdates.splice(i, 0, card);
      return staleUpdates.slice(0, 5);
    }
  }

  if (staleUpdates.length < 5) return [...staleUpdates, card];

  return staleUpdates;
};
