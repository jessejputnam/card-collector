const closeDelFormBtn = document.getElementById("closeDelForm");
const formContainer = document.getElementById("formContainer");
const removeBinderBtn = document.getElementById("removeBinderBtn");

removeBinderBtn.addEventListener("click", () => {
  formContainer.classList.remove("hidden");
  removeBinderBtn.classList.add("hidden");
});

closeDelFormBtn.addEventListener("click", () => {
  formContainer.classList.add("hidden");
  removeBinderBtn.classList.remove("hidden");
});
