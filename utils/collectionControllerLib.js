/**
 * Add card to recent updates array if more recently updated than the last sampleSize
 * @param {Card[]} recentUpdates
 * @param {Card} card
 * @param {number} sampleSize
 * @returns
 */
exports.updateRecentUpdates = (recentUpdates, card, sampleSize) => {
  if (recentUpdates.length == 0) return [card];

  for (let i = 0; i < recentUpdates.length; i++) {
    const recentDate = new Date(recentUpdates[i].value.priceHistory[0][0]);
    const cardDate = new Date(card.value.priceHistory[0][0]);
    if (cardDate > recentDate) {
      recentUpdates.splice(i, 0, card);
      return recentUpdates.slice(0, sampleSize);
    }
  }

  if (recentUpdates.length < sampleSize) return [...recentUpdates, card];

  return recentUpdates;
};

/**
 * Add card to least recent updates array if less recently updated than the last sampleSize
 * @param {Card[]} staleUpdates
 * @param {Card} card
 * @param {number} sampleSize
 * @returns
 */
exports.updateStaleUpdates = (staleUpdates, card, sampleSize) => {
  if (staleUpdates.length == 0) return [card];

  for (let i = 0; i < staleUpdates.length; i++) {
    const staleDate = new Date(staleUpdates[i].value.priceHistory[0][0]);
    const cardDate = new Date(card.value.priceHistory[0][0]);
    if (cardDate < staleDate) {
      staleUpdates.splice(i, 0, card);
      return staleUpdates.slice(0, sampleSize);
    }
  }

  if (staleUpdates.length < sampleSize) return [...staleUpdates, card];

  return staleUpdates;
};

/**
 * Helper function for set ordering
 * @param {Card[]} arr
 * @param {Card} cur
 * @returns
 */
exports.addSetOrdered = (arr, cur) => {
  for (let i = 0; i < arr.length; i++) {
    if (cur.ownedCards > arr[i].ownedCards) {
      arr.splice(i, 0, cur);
      return;
    }
  }
  arr.push(cur);
};

/**
 * Initialize a new card set in the card sets object
 * @param {Object} cardsBySet
 * @param {Card} card
 */
exports.initCardSet = (cardsBySet, card) => {
  cardsBySet[card.set.name] = {
    setTotal: card.set.cardCount,
    symbolUrl: card.set.symbolUrl,
    uniqueCards: new Set(),
    reverseHoloCards: 0,
    ownedCards: 0,
    ownedValue: 0
  };
};
