const toggleManualInputBtn = document.getElementById("toggleManualInput");
const manualInputForm = document.getElementById("manualInputForm");

toggleManualInputBtn.addEventListener("click", () => {
  manualInputForm.classList.toggle("hidden");
});
