"use strict";
const showAddBinder = document.getElementById("showAddBinder");
const submitBinder = document.getElementById("submitBinder");
const closeNewBinder = document.getElementById("closeNewBinder");

showAddBinder.addEventListener("click", () => {
  showAddBinder.closest(".add-binder-form").classList.add("hidden");
  submitBinder.closest(".add-binder-form").classList.remove("hidden");

  closeNewBinder.addEventListener("click", () => {
    showAddBinder.closest(".add-binder-form").classList.remove("hidden");
    submitBinder.closest(".add-binder-form").classList.add("hidden");
  });
});
