exports.buildCardDetail = (card, set) => {
  return {
    _id: card._id,
    name: card.pokemon.name,
    id: card.id,
    oldId: card.oldId,
    userId: card.userId,
    custom: card.custom,
    meta: {
      rarity: card.meta.rarity,
      supertype: card.meta.supertype,
      stage: card.meta.stage,
      setNumber: card.meta.set.number,
      images: card.meta.images
    },
    set: {
      _id: set?._id ?? card.setTcgPlayerNumericId, // if no set given, just the id
      id: set?.tcgPlayerNumericId,
      name: set?.name,
      series: set?.series,
      releaseDate: set?.releaseDate,
      cardCount: set?.cardCount,
      symbolUrl: set?.symbolUrl
    },
    oldSetData: `${card.meta.set.name} [${card.meta.set.series}] - ${card.meta.set.releaseDate}`,
    value: card.value,
    binder: card.binder,
    lang: card.isJapanese ? "japanese" : "english"
  };
};

exports.buildDashCard = (card, sets) => {
  const set = sets[card.setTcgPlayerNumericId];

  return {
    _id: card._id,
    name: card.pokemon.name,
    id: card.id,
    oldId: card.oldId,
    custom: card.custom,
    rarity: card.meta.rarity,
    setNumber: card.meta.set.number,
    image: card.meta.images.small,
    set: {
      id: set?.tcgPlayerNumericId,
      name: set?.name,
      series: set?.series,
      releaseDate: set?.releaseDate,
      cardCount: set?.cardCount,
      symbolUrl: set?.symbolUrl
    },
    value: card.value,
    binder: card.binder
  };
};
