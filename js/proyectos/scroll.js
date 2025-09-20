document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".contenedorproyectos > section");
  let current = 0;
  let isAnimating = false;

  function goTo(index) {
    if (isAnimating) return;
    if (index < 0 || index >= sections.length) return;

    isAnimating = true;
    current = index;

    sections[current].scrollIntoView({ behavior: "smooth" });

    // bloquea múltiples saltos seguidos
    setTimeout(() => {
      isAnimating = false;
    }, 300);
  }

  // --- Scroll con mouse (desktop) ---
  window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
      goTo(current + 1);
    } else if (e.deltaY < 0) {
      goTo(current - 1);
    }
  });

  // --- Scroll con touch (mobile) ---
  let startY = 0;
  window.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  window.addEventListener("touchend", (e) => {
    let endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) {
      goTo(current + 1); // swipe up
    } else if (endY - startY > 50) {
      goTo(current - 1); // swipe down
    }
  });
});
