const seriesUpdateCont = document.getElementById("series-update-container");
const updateSeriesBtn = document.getElementById("update-series-btn");
const closeBtn = document.getElementById("close-btn");
const msgContainer = document.getElementById("msg");

closeBtn.addEventListener("click", () => {
  seriesUpdateCont.classList.remove("visible");
});

updateSeriesBtn.addEventListener("click", () => {
  seriesUpdateCont.classList.add("visible");
});

if (msgContainer) {
  setTimeout(() => msgContainer.classList.add("show"), 10);
  setTimeout(() => msgContainer.classList.remove("show"), 3000);
}
