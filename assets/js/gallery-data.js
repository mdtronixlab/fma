/**
 * Gallery Media Data
 * ------------------
 * Hand-picked/curated items only. Add, remove, or reorder items here to
 * update these specific entries.
 *
 * Photos dropped into assets/images/gallery/ (e.g. via cPanel File Manager)
 * are picked up automatically by assets/gallery-list.php and appended after
 * these — no code changes needed for those. See README.md.
 *
 * Fields:
 *   image    {string}  - Path to the image file
 *   title    {string}  - Display title (shown in overlay & lightbox)
 *   category {string}  - Filter category: "training" | "classes" | "lifestyle"
 *   alt      {string}  - Accessible alt text for the image
 *   portrait {boolean} - (optional) true = taller card in the grid
 */

const GALLERY_ITEMS = [
  {
    image: "./assets/images/class-1.jpg",
    title: "Weight Lifting Session",
    category: "training",
    alt: "Weight Lifting Session",
  },
  {
    image: "./assets/images/class-2.jpg",
    title: "Cardio & Strength",
    category: "training",
    alt: "Cardio and Strength Training",
    portrait: true,
  },
  {
    image: "./assets/images/class-3.jpg",
    title: "Power Yoga Class",
    category: "classes",
    alt: "Power Yoga Class",
  },
  {
    image: "./assets/images/blog-1.jpg",
    title: "First Day at the Gym",
    category: "lifestyle",
    alt: "First Day at the Gym",
  },
  {
    image: "./assets/images/class-4.jpg",
    title: "Fitness Pack Session",
    category: "classes",
    alt: "Fitness Pack Session",
  },
  {
    image: "./assets/images/blog-2.jpg",
    title: "Fitness Journey",
    category: "lifestyle",
    alt: "Fitness Journey",
    portrait: true,
  },
  {
    image: "./assets/images/about-banner.png",
    title: "Team Training",
    category: "training",
    alt: "Team Training",
  },
  {
    image: "./assets/images/blog-3.jpg",
    title: "Healthy Living",
    category: "lifestyle",
    alt: "Healthy Living",
  },
  {
    image: "./assets/images/about-coach.jpg",
    title: "Meet Our Coach",
    category: "training",
    alt: "Meet Our Coach",
  },
  {
    image: "./assets/images/video-banner.jpg",
    title: "Studio Tour",
    category: "classes",
    alt: "Studio Tour",
  },
];
