const BASE_URL = "https://www.pokemonpricetracker.com/api/v2";
const TOKEN = process.env.POKE_PRICE_API_KEY;
const apiLimit = 15;

exports.getCard = async (cardId, lang = "english") => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };

  const path = `/cards/?language=${lang}&tcgPlayerId=${cardId}`;

  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const msg =
      res.status == 429
        ? (res.statusText ??
          "Price API limit reached. Please try again tomorrow.")
        : `[STATUS ${res.status}] ${res.statusText}`;
    throw new Error(`Failed to fetch card: ${msg}`);
  }
  return res.json();
};

exports.getCardsBySearch = async (query, setId = null, lang = "english") => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };

  const queryParams = setId
    ? `search=${query}&setId=${setId}`
    : `search=${query}`;

  const res = await fetch(
    `${BASE_URL}/cards?language=${lang}&${queryParams}&limit=${apiLimit}`,
    options
  );
  if (!res.ok) {
    console.log(res);
    const msg =
      res.status == 429
        ? (res.statusText ??
          "Price API limit reached. Please try again tomorrow.")
        : `[STATUS ${res.status}] ${res.statusText}`;
    throw new Error(`Failed to fetch cards: ${msg}`);
  }
  return res.json();
};

exports.getSets = async (lang = "english") => {
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${TOKEN}` }
  };
  const res = await fetch(
    `${BASE_URL}/sets?language=${lang}&limit=500`,
    options
  );
  if (!res.ok) throw new Error("Failed to fetch sets");
  return res.json();
};
