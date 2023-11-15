const auto_update_cont = document.getElementById('auto-update-form-container');
const auto_update_toggle = document.getElementById("auto-update-toggle");

auto_update_toggle.addEventListener("click", () => {
  auto_update_cont.classList.add("visible");
  console.log("testing");
})