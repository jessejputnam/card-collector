function sortCardQuery(cards, sortType, isAsc) {
  // let card_list;
  if (!sortType || sortType === "value")
    !isAsc ? cards.sort(byValueDesc) : cards.sort(byValueAsc);
  else if (sortType === "rarity")
    !isAsc ? cards.sort(byRarityDesc) : cards.sort(byRarityAsc);
  else if (sortType === "name")
    !isAsc ? cards.sort(byNameDesc) : cards.sort(byNameAsc);
  else if (sortType === "set")
    !isAsc ? cards.sort(bySetDesc) : cards.sort(bySetAsc);
  else if (sortType === "supertype")
    !isAsc ? cards.sort(bySupertypeDesc) : cards.sort(bySupertypeAsc);
}

const b = () => {
  let card_list;

  if (sortBy === "value")
    card_list = !sortAsc
      ? bySets.sort(sort.byValueDesc)
      : (card_list = bySets.sort(sort.byValueAsc));
  else if (sortBy === "rarity")
    card_list = !sortAsc
      ? bySets.sort(sort.byRarityDesc)
      : (card_list = bySets.sort(sort.byRarityAsc));
  else if (sortBy === "name")
    card_list = !sortAsc
      ? bySets.sort(sort.byNameDesc)
      : bySets.sort(sort.byNameAsc);
  else if (sortBy === "set")
    card_list = !sortAsc
      ? bySets.sort(sort.bySetDesc)
      : (card_list = bySets.sort(sort.bySetAsc));
  else if (sortBy === "supertype")
    card_list = !sortAsc
      ? bySets.sort(sort.bySupertypeDesc)
      : (card_list = bySets.sort(sort.bySupertypeAsc));
};

function byValueDesc(a, b) {
  const valA = a.value.market;
  const valB = b.value.market;

  if (valA < valB) return 1;
  if (valA > valB) return -1;
  return 0;
}

function byValueAsc(a, b) {
  const valA = a.value.market;
  const valB = b.value.market;

  if (valA < valB) return -1;
  if (valA > valB) return 1;
  return 0;
}

function byRarityAsc(a, b) {
  const rarityA = a.meta.rarity.grade;
  const rarityB = b.meta.rarity.grade;

  if (rarityA < rarityB) return -1;
  if (rarityA > rarityB) return 1;
  return 0;
}

function byRarityDesc(a, b) {
  const rarityA = a.meta.rarity.grade;
  const rarityB = b.meta.rarity.grade;

  if (rarityA < rarityB) return 1;
  if (rarityA > rarityB) return -1;
  return 0;
}

function byNameAsc(a, b) {
  const nameA = a.pokemon.name.toLowerCase();
  const nameB = b.pokemon.name.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

function byNameDesc(a, b) {
  const nameA = a.pokemon.name.toLowerCase();
  const nameB = b.pokemon.name.toLowerCase();

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
}

function bySetAsc(a, b) {
  const nameA = a.meta.set.releaseDate;
  const nameB = b.meta.set.releaseDate;

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

function bySetDesc(a, b) {
  const nameA = a.meta.set.releaseDate;
  const nameB = b.meta.set.releaseDate;

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
}

function bySupertypeAsc(a, b) {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
}

function bySupertypeDesc(a, b) {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
}

function byDateDesc(a, b) {
  const dateA = new Date(a[1][1]);
  const dateB = new Date(b[1][1]);

  if (dateA < dateB) return 1;
  else if (dateA > dateB) return -1;
  else return 0;
}

function byCardNumber(a, b) {
  const numA = Number(
    a.meta.set.number
      .split("")
      .filter((x) => !!+x || x === "0")
      .join("")
  );
  const numB = Number(
    b.meta.set.number
      .split("")
      .filter((x) => !!+x || x === "0")
      .join("")
  );
  return numA - numB;
}

function bySupertypeDesc(a, b) {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA > nameB) return -1;
  if (nameA < nameB) return 1;
  return 0;
}

function bySupertypeAsc(a, b) {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA > nameB) return 1;
  if (nameA < nameB) return -1;
  return 0;
}

module.exports = {
  sortCardQuery,
  byValueAsc,
  byValueDesc,
  byRarityAsc,
  byRarityDesc,
  byNameAsc,
  byNameDesc,
  bySetAsc,
  bySetDesc,
  bySupertypeAsc,
  bySupertypeDesc,
  byDateDesc,
  byCardNumber
};
