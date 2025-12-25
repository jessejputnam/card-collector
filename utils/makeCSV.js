function makeCSV(cards) {
  const arr = [];

  const header = ["Name", "Num", "Set", "Type", "Value", "Count", "Total"];
  arr.push(header);

  for (let card of cards) {
    const row = [
      `"${card.pokemon.name}"`,
      card.meta.set.number,
      card.meta.set.name,
      card.value.priceType,
      card.value.market,
      card.value.count || 1,
      (card.value.count || 1) * card.value.market
    ];

    arr.push(row.join(","));
  }

  const csv = arr.join("\n");

  return csv;
}

module.exports = makeCSV;
