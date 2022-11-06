"use strict";

const topbar = document.querySelector(".topbar");
const collectionBtn = document.querySelector("#collection-menu-btn");
const collectionMenu = document.querySelector(".collection-menu");
const bulkBtn = document.querySelector("#bulk-menu-btn");
const bulkMenu = document.querySelector(".bulk-menu");

if (collectionBtn) {
  collectionBtn.addEventListener("click", (e) => {
    collectionMenu.classList.toggle("menu-open");
  });
}

if (bulkBtn) {
  bulkBtn.addEventListener("click", (e) => {
    bulkMenu.classList.toggle("menu-open");
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
