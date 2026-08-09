"use strict";

/**
 * Google Ads (AW-11098816666) event tracking.
 *
 * Fires a "contact_click" event to gtag whenever a visitor clicks any
 * WhatsApp / contact link on the page (identified by a `wa.me` href, or an
 * explicit `data-gtag-label` attribute). Uses event delegation so it also
 * covers buttons added later without needing extra wiring.
 */
(function () {
  function getLabel(link) {
    return (
      link.getAttribute("data-gtag-label") ||
      link.getAttribute("aria-label") ||
      link.textContent.trim() ||
      "Contact Button"
    );
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest('a[href*="wa.me"], [data-gtag-label]');
    if (!link) return;

    if (typeof gtag !== "function") return;

    gtag("event", "contact_click", {
      event_category: "engagement",
      event_label: getLabel(link),
      link_url: link.href || "",
    });
  });

  // "Join Now" modal form (index.html) counts as a contact/lead submission too.
  const joinForm = document.getElementById("joinForm");
  if (joinForm) {
    joinForm.addEventListener("submit", function () {
      if (typeof gtag !== "function") return;
      gtag("event", "contact_click", {
        event_category: "engagement",
        event_label: "Join Modal Form",
      });
    });
  }
})();
