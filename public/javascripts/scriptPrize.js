"use strict";

const prizeCards = document.querySelectorAll(".prize-img-container");

prizeCards.forEach((prizeCard) => {
  prizeCard.addEventListener("click", (e) => {
    const clicked = e.target.closest("div.prize-img-container");

    location.href = `/collection/${clicked.id}`;
  });
});
