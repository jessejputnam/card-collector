const btns = document.getElementsByClassName("btn-csv");

for (let btn of btns) {
  btn.addEventListener("click", (e) => {
    const target = e.target.closest(".btn-csv");
    const data = target.dataset.csv;

    const blob = new Blob([data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "cards.csv");

    a.click();
  });
}
