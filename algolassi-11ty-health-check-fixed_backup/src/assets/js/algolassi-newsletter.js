(function () {
  "use strict";

  function initNewsletter() {
    var forms = document.querySelectorAll("[data-newsletter-form]");
    forms.forEach(function (form) {
      if (form.dataset.initialized === "true") return;
      form.dataset.initialized = "true";

      var status = form.querySelector("[data-newsletter-status]");
      var button = form.querySelector("button[type='submit']");

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var email = (form.elements.email.value || "").trim();
        if (!email || !form.elements.email.checkValidity()) {
          if (status) status.textContent = "Please enter a valid email address.";
          form.elements.email.focus();
          return;
        }

        if (button) { button.disabled = true; button.textContent = "Subscribing..."; }
        if (status) status.textContent = "";

        fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            website: form.elements.website ? form.elements.website.value : ""
          })
        })
          .then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
              if (!response.ok) throw new Error(data.message || "Unable to subscribe right now.");
              return data;
            });
          })
          .then(function (data) {
            form.reset();
            if (status) status.textContent = data.message || "Thanks! Please check your inbox to confirm your subscription.";
          })
          .catch(function (error) {
            if (status) status.textContent = error.message || "Sorry, something went wrong. Please try again later.";
          })
          .finally(function () {
            if (button) { button.disabled = false; button.textContent = "Subscribe"; }
          });
      });
    });
  }

  window.AlgolassiNewsletterInit = initNewsletter;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initNewsletter);
  else initNewsletter();
  window.addEventListener("algolassi:spa-navigation", initNewsletter);
})();
