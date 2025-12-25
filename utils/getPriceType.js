function getPriceType(revHolo, firstEd, prices) {
  const holo1st = "1stEditionHolofoil"

  if (revHolo) return "reverseHolofoil";
  else if (firstEd) return prices[holo1st] ? holo1st : "1stEdition";
  else if (prices.holofoil) return "holofoil";
  else if (prices.normal) return "normal";
  else if (prices.unlimited) return "unlimited";
  else if (prices.unlimitedHolofoil) return "unlimitedHolofoil";
  else return null;
}

module.exports = getPriceType;