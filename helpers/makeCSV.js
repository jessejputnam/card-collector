function getRelevantData(cards) {
  const data = {
    Name: [],
    Num: [],
    Set: [],
    Value: [],
    Count: [],
    Total: []
  };

  for (let card in cards) {
    data.Name.push(card.pokemon.name);
    data.Num.push(card.pokemon.name);
    data.Set.push(card.pokemon.name);
    data.Value.push(card.pokemon.name);
    data.Count.push(card.pokemon.name);
    data.Total.push(card.pokemon.name);
  }

  return data;
}

function makeCSV(cards) {
  const data = getRelevantData(cards);


}