const sortByDate = (a, b) => {
  const dateA = new Date(a[1]);
  const dateB = new Date(b[1]);

  if (dateA < dateB) return 1;
  else if (dateA > dateB) return -1;
  else return 0;
};

module.exports = sortByDate;
