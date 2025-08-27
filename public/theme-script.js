(function () {
  try {
    const theme = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = theme === "dark" || (theme === "system" && systemDark);
    if (resolved) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    // ignore
  }
})();
