// Plain JavaScript so startup diagnostics still work if the app bundle cannot load.
(function () {
  var panel = document.getElementById("startup-status");
  var message = document.getElementById("startup-message");
  var ready = false;
  function fail(text) {
    if (ready || !panel || !message) return;
    panel.hidden = false;
    message.textContent = text;
    panel.setAttribute("role", "alert");
  }
  window.addEventListener("handoff:ready", function () {
    ready = true;
    if (panel) panel.hidden = true;
  });
  window.addEventListener(
    "error",
    function (event) {
      var target = event.target;
      if (
        target &&
        (target.tagName === "SCRIPT" || target.tagName === "LINK")
      ) {
        fail(
          "An application file could not load. Try a private browser window and check that the address is https://kendallw64.github.io/Handoff-App/.",
        );
      } else {
        fail(
          "The browser could not start Handoff. Please share your browser name and the first red error in its developer console.",
        );
      }
    },
    true,
  );
  setTimeout(function () {
    fail(
      "Handoff has not finished loading. Try a private browser window. If it still fails, share the exact address and browser name so we can investigate.",
    );
  }, 10000);
  document
    .getElementById("startup-reload")
    .addEventListener("click", function () {
      var url = new URL(window.location.href);
      url.searchParams.set("reload", String(Date.now()));
      window.location.replace(url.href);
    });
})();
