exports.byValueDesc = (a, b) => b.value.market - a.value.market;
exports.byValueAsc = (a, b) => a.value.market - b.value.market;
exports.byRarityAsc = (a, b) => b.meta.rarity.grade - a.meta.rarity.grade;
exports.byRarityDesc = (a, b) => a.meta.rarity.grade - b.meta.rarity.grade;
exports.byNameAsc = (a, b) => {
  const nameA = a.pokemon.name.toLowerCase();
  const nameB = b.pokemon.name.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};
exports.byNameDesc = (a, b) => {
  const nameA = a.pokemon.name.toLowerCase();
  const nameB = b.pokemon.name.toLowerCase();

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
};
exports.bySetAsc = (a, b) => {
  const nameA = a.meta.set.releaseDate;
  const nameB = b.meta.set.releaseDate;

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};
exports.bySetDesc = (a, b) => {
  const nameA = a.meta.set.releaseDate;
  const nameB = b.meta.set.releaseDate;

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
};
exports.bySupertypeAsc = (a, b) => {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};
exports.bySupertypeDesc = (a, b) => {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA < nameB) return 1;
  if (nameA > nameB) return -1;
  return 0;
};
exports.byDateDesc = (a, b) => {
  const dateA = new Date(a[1][1]);
  const dateB = new Date(b[1][1]);

  if (dateA < dateB) return 1;
  else if (dateA > dateB) return -1;
  else return 0;
};
exports.byCardNumber = (a, b) => {
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
};
exports.bySupertypeDesc = (a, b) => {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA > nameB) return -1;
  if (nameA < nameB) return 1;
  return 0;
};
exports.bySupertypeAsc = (a, b) => {
  const nameA = a.meta.supertype.toLowerCase();
  const nameB = b.meta.supertype.toLowerCase();

  if (nameA > nameB) return 1;
  if (nameA < nameB) return -1;
  return 0;
};
