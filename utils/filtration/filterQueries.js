const filterQueries = (collection, savedQuery) => {
  const byReverse = !savedQuery.reverseholo
    ? collection
    : collection.filter((card) => card.meta.rarity.reverseHolo);

  const byVal = byReverse.filter((card) => {
    if (savedQuery.compareValue === ">=")
      return card.value.market >= Number(savedQuery.value);
    else return card.value.market <= Number(savedQuery.value);
  });

  const byName = byVal.filter((card) => {
    return card.pokemon.name
      .toLowerCase()
      .includes(savedQuery.name.toLowerCase());
  });

  const byRare = !savedQuery.rarities
    ? byName
    : byName.filter((card) => {
        if (!Array.isArray(savedQuery.rarities))
          savedQuery.rarities = [savedQuery.rarities];
        return savedQuery.rarities.includes(card.meta.rarity.type);
      });

  const bySupertypes = !savedQuery.supertypes
    ? byRare
    : byRare.filter((card) => {
        if (!Array.isArray(savedQuery.supertypes))
          savedQuery.supertypes = [savedQuery.supertypes];
        return savedQuery.supertypes.includes(card.meta.supertype);
      });

  const bySubtypes = !savedQuery.subtypes
    ? bySupertypes
    : bySupertypes.filter((card) => {
        let check = 0;
        if (!Array.isArray(savedQuery.subtypes))
          savedQuery.subtypes = [savedQuery.subtypes];

        card.meta.subtypes.forEach((subtype) => {
          if (savedQuery.subtypes.includes(subtype)) check++;
        });
        return check > 0;
      });

  const bySets = !savedQuery.sets
    ? bySubtypes
    : bySubtypes.filter((card) => {
        if (!Array.isArray(savedQuery.sets))
          savedQuery.sets = [savedQuery.sets];
        return savedQuery.sets.includes(card.meta.set.id);
      });

  return bySets;
};

module.exports = filterQueries;
