(() => {
  const root = document.documentElement;
  const syncTheme = () => {
    const body = document.body;
    if (!body) {
      return false;
    }
    const isDark = root.classList.contains("dark");
    root.dataset.theme = isDark ? "dark" : "light";
    body.classList.toggle("theme-dark", isDark);
    return true;
  };

  const initObserver = () => {
    if (!window.MutationObserver) {
      return;
    }
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "class")) {
        syncTheme();
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  };

  const start = () => {
    if (syncTheme()) {
      initObserver();
    } else {
      // body not ready yet — try again at next tick.
      requestAnimationFrame(start);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
