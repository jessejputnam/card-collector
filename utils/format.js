exports.formatMoney = (n) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(n);
};
exports.formatNum = (n) => {
  return new Intl.NumberFormat("en-US").format(n);
};
