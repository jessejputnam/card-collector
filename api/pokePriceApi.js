const BASE_URL = "https://www.pokemonpricetracker.com/api/v2";
const TOKEN = process.env.POKE_PRICE_API_KEY;

exports.getCard = async (cardId) => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };

  const res = await fetch(`${BASE_URL}/cards/?tcgPlayerId=${cardId}`, options);
  if (!res.ok) {
    const msg =
      res.status == 429
        ? "Price API limit reached. Please try again tomorrow."
        : `[STATUS ${res.status}] ${res.statusText}`;
    throw new Error(`Failed to fetch card: ${msg}`);
  }
  return res.json();
};

exports.getCardsBySearch = async (query, setId = null) => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };

  const queryParams = setId
    ? `search=${query}&setId=${setId}`
    : `search=${query}`;

  const res = await fetch(`${BASE_URL}/cards?${queryParams}&limit=5`, options);
  if (!res.ok) {
    const msg =
      res.status == 429
        ? "Price API limit reached. Please try again tomorrow."
        : `[STATUS ${res.status}] ${res.statusText}`;
    throw new Error(`Failed to fetch cards: ${msg}`);
  }
  return res.json();
};

exports.getSets = async () => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };
  const res = await fetch(`${BASE_URL}/sets?limit=500`, options);
  if (!res.ok) throw new Error("Failed to fetch sets");
  return res.json();
};
