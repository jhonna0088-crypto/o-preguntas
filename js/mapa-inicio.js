const previewButtons = document.querySelectorAll("[data-preview-choice]");
const previewSize = document.querySelector(".preview-size");

previewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const preview = button.dataset.previewChoice;
    document.body.dataset.preview = preview;

    previewButtons.forEach((option) => {
      const isActive = option === button;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });

    previewSize.textContent = preview === "mobile" ? "VISTA MÓVIL · 390 PX" : "VISTA ESCRITORIO · FLUIDA";
  });
});
