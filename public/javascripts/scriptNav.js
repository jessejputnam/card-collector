"use strict";

const topbar = document.querySelector(".topbar");
const collectionBtn = document.querySelector("#collection-menu-btn");
const collectionMenu = document.querySelector(".collection-menu");

if (collectionBtn) {
  collectionBtn.addEventListener("click", (e) => {
    collectionMenu.classList.toggle("menu-open");
  });
}

if (topbar) {
  document.addEventListener("click", (e) => {
    if (e.target.id !== "collection-menu-btn") {
      collectionMenu.classList.remove("menu-open");
    }
    if (e.target.id !== "bulk-menu-btn") {
      bulkMenu.classList.remove("menu-open");
    }
  });
}
