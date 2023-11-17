function makeCSV(cards) {
  const arr = [];

  const header = ["Name", "Num", "Set", "Value", "Count", "Total"];
  arr.push(header);

  for (let card of cards) {
    const row = [
      `"${card.pokemon.name}"`,
      card.set.number,
      card.set.name,
      card.value.market,
      card.value.count || 1,
      (card.value.count || 1) * card.value.market
    ];

    arr.push(row.join(","));
  }

  const csv = arr.join("\n");

  console.log(csv);
  return csv;
}

module.exports = makeCSV;
