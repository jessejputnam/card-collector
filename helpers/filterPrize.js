const filterPrize = (card, rarity) => {
  type = card.meta.supertype;
  grade = card.meta.rarity.grade;
  return (type === "Pokémon" && (rarity == 2 ? grade > 1 : grade === rarity));
}

module.exports = filterPrize;