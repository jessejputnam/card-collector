/**
 * Get conversion rate to apply to USD
 * @param {string} curr
 * @returns
 */
const getConversionRate = async (curr) => {
  if (curr === "usd") return 1;

  let currConvert = 1;
  const api_url =
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

  try {
    const response = await fetch(api_url);
    const exchange = await response.json();
    currConvert = exchange.usd[curr];
  } catch {
    return next(new Error("Currency exchange API issue"));
  }

  return currConvert;
};

module.exports = getConversionRate;
