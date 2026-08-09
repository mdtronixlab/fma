'use strict';



/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}



/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");

const toggleNavbar = function () { navbar.classList.toggle("active"); }

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () { navbar.classList.remove("active"); }

addEventOnElem(navLinks, "click", closeNavbar);



/**
 * header & back top btn active
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

window.addEventListener("scroll", function () {
  if (window.scrollY >= 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});



/**
 * Auto-scroll for gym interior carousel (Infinite)
 */

const gymCarousel = document.getElementById("gym-interior-carousel");

if (gymCarousel) {
  let isAutoScrolling = true;

  // Duplicate items for infinite scroll effect
  const items = Array.from(gymCarousel.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    gymCarousel.appendChild(clone);
  });

  // Pause scrolling on hover
  gymCarousel.addEventListener("mouseenter", () => isAutoScrolling = false);
  gymCarousel.addEventListener("mouseleave", () => isAutoScrolling = true);
  
  // Pause on touch (for mobile)
  gymCarousel.addEventListener("touchstart", () => isAutoScrolling = false);
  gymCarousel.addEventListener("touchend", () => {
    setTimeout(() => isAutoScrolling = true, 2000);
  });

  setInterval(function() {
    if (!isAutoScrolling) return;

    // Calculate halfway point (the start of our cloned items)
    // We add gap * number of items to make it accurate
    const halfScrollWidth = gymCarousel.scrollWidth / 2;

    // If we've scrolled into the cloned set, jump back to the original set silently
    if (gymCarousel.scrollLeft >= halfScrollWidth - gymCarousel.clientWidth) {
      gymCarousel.style.scrollSnapType = 'none'; // Temporarily disable snapping to prevent glitches
      gymCarousel.scrollBy({
        left: -halfScrollWidth,
        behavior: "instant"
      });
      // Force reflow
      gymCarousel.offsetHeight;
      gymCarousel.style.scrollSnapType = 'inline mandatory';
    }

    // Scroll to next item
    const scrollAmount = gymCarousel.clientWidth * 0.8 + 30; 
    gymCarousel.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    });
  }, 3000);
}



/**
 * Join Now modal
 */

const joinModal = document.getElementById("joinModal");
const joinForm  = document.getElementById("joinForm");
const joinSuccess = document.getElementById("joinSuccess");

const openModal  = function () {
  joinModal.classList.add("is-open");
  joinModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeModal = function () {
  joinModal.classList.remove("is-open");
  joinModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    openModal();
  });
});

document.querySelectorAll("[data-modal-close]").forEach(function (el) {
  el.addEventListener("click", closeModal);
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && joinModal.classList.contains("is-open")) closeModal();
});

joinForm.addEventListener("submit", function (e) {
  e.preventDefault();
  joinForm.hidden = true;
  joinSuccess.hidden = false;
  setTimeout(function () {
    joinForm.reset();
    joinForm.hidden = false;
    joinSuccess.hidden = true;
    closeModal();
  }, 2500);
});



/**
 * Autoplay videos when they scroll into view, pause when they leave
 */

const sectionVideos = document.querySelectorAll("#videos video");

if (sectionVideos.length) {
  const videoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.muted = true;
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });

  sectionVideos.forEach(function (video) {
    videoObserver.observe(video);
  });
}



/**
 * Fetch Team Data
 *
 * Team members are managed exclusively through /admin (see
 * admin/upload.php), which writes them into this manifest — a plain
 * static JSON file, not a PHP endpoint.
 */

const teamList = document.getElementById("team-list");
const fetchTeam = async function () {
  if (!teamList) return;

  try {
    const response = await fetch("./assets/images/team/manifest.json", { cache: "no-store" });
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      teamList.innerHTML = ""; // Clear loading state

      data.forEach(member => {
        const li = document.createElement("li");
        li.classList.add("scrollbar-item");

        li.innerHTML = `
          <div class="team-card">
            <figure class="card-banner img-holder" style="--width: 240; --height: 320">
              <img src="${member.image}" width="240" height="320" loading="lazy" alt="${member.name}" class="img-cover">
            </figure>

            <div class="card-content">
              <h3 class="h3 card-title">${member.name}</h3>
              <p class="card-subtitle">${member.designation}</p>
            </div>
          </div>
        `;

        teamList.appendChild(li);
      });
    } else {
      teamList.innerHTML = `<p class="section-text text-center">No team members added yet.</p>`;
    }
  } catch (error) {
    console.error("Error fetching team data:", error);
    teamList.innerHTML = `<p class="section-text text-center">Failed to load team data. Please try again later.</p>`;
  }
}

fetchTeam();



/**
 * Load client transformation photos (same manifest as the gallery page).
 * Uploading a photo under the "Transformation" category in /admin makes
 * it show up here automatically.
 */

const transformationList = document.getElementById("transformation-list");
const fetchTransformations = async function () {
  if (!transformationList) return;

  try {
    const response = await fetch("./assets/images/gallery/manifest.json", { cache: "no-store" });
    const data = await response.json();
    const items = Array.isArray(data)
      ? data.filter(item => item.category === "transformation")
      : [];

    if (items.length === 0) {
      transformationList.innerHTML = `<li class="scrollbar-item"><p class="section-text text-center">Client transformations coming soon.</p></li>`;
      return;
    }

    transformationList.innerHTML = "";

    items.forEach(item => {
      const li = document.createElement("li");
      li.classList.add("scrollbar-item");

      li.innerHTML = `
        <div class="class-card">
          <figure class="card-banner img-holder" style="--width: 416; --height: 240">
            <img src="${item.image}" width="416" height="240" loading="lazy" alt="${item.alt}" class="img-cover">
          </figure>

          <div class="card-content">
            <h3 class="h3 card-title">${item.title}</h3>
          </div>
        </div>
      `;

      transformationList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching transformation photos:", error);
    transformationList.innerHTML = `<li class="scrollbar-item"><p class="section-text text-center">Client transformations coming soon.</p></li>`;
  }
}

fetchTransformations();