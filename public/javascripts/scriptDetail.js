const autoUpdateCont = document.getElementById("auto-update-form-container");
const autoUpdateToggle = document.getElementById("auto-update-toggle");
const closeBtn = document.getElementById("close-btn");
const msgContainer = document.getElementById("msg");
const cardImage = document.getElementById("cardImg");
const symbolImage = document.getElementById("symbolImg");
const priceChart = document.getElementById("priceChart");
const setSearch = document.getElementById("setSearch");
const setSelect = document.getElementById("newSetId");
const saveSetBtn = document.getElementById("saveSetBtn");

// Set search filter
if (setSearch) {
  const options = Array.from(setSelect.options);
  setSearch.addEventListener("input", () => {
    const query = setSearch.value.toLowerCase();

    options.forEach((opt) => {
      const match = opt.text.toLowerCase().includes(query);
      opt.hidden = !match;
    });
  });

  setSelect.addEventListener("change", () => {
    saveSetBtn.disabled = setSelect === "none";
  });
}

if (autoUpdateToggle) {
  autoUpdateToggle.addEventListener("click", () => {
    autoUpdateCont.classList.add("visible");
  });
}

closeBtn.addEventListener("click", () => {
  autoUpdateCont.classList.remove("visible");
});

if (msgContainer) {
  setTimeout(() => msgContainer.classList.add("show"), 10);
  setTimeout(() => msgContainer.classList.remove("show"), 3000);
}

cardImage.addEventListener("error", () => {
  cardImage.src = "/images/missingno.png";
});

if (symbolImage) {
  symbolImage.addEventListener("error", () => {
    symbolImage.src = "/images/question-mark.png";
  });
}
// ############ CHART #################

const dataPoints = priceHistory
  .map(([date, price]) => {
    const [m, d, y] = date.split("/").map(Number);
    return { x: new Date(y, m - 1, d), y: Number(price) };
  })
  .sort((a, b) => a.x - b.x);

const xMin = dataPoints[0].x;
const xMax = dataPoints[dataPoints.length - 1].x;

new Chart(priceChart, {
  type: "line",
  data: {
    datasets: [
      {
        data: dataPoints,
        borderColor: "black",
        borderWidth: 1,
        pointRadius: 2,
        tension: 0.1
      }
    ]
  },
  options: {
    parsing: false, // already shaped {x, y}
    responsive: true,
    scales: {
      x: {
        type: "time",
        min: xMin,
        max: xMax,
        time: {
          unit: "year", // automatically picks an appropriate tick for long spans
          tooltipFormat: "MMM d, yyyy"
        },
        title: {
          display: false,
          text: "Date"
        }
      },
      y: {
        beginAtZero: false,
        title: { display: false, text: "Price (USD)" },
        ticks: {
          callback: function (value, index, values) {
            return value.toLocaleString("en-US", {
              style: "currency",
              currency: "USD"
            });
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`
        }
      }
    }
  }
});
