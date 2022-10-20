"use strict";

const collectionItems = document.querySelectorAll(".collection-item");

collectionItems.forEach((collectionItem) => {
  collectionItem.addEventListener("click", (e) => {
    const clicked = e.target.closest("div.collection-item");

    location.href = `/collection/${clicked.id}`;
  });
});
