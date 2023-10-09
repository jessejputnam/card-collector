const filterElite = (card, wotc) => {
  type = card.meta.supertype;
  year = +card.meta.set.releaseDate.split("/")[0]

  return ((type === "Pokémon") && (wotc ? year < 2004 : year > 2003));
}

module.exports = filterElite;