class ClassCard extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title');
    const image = this.getAttribute('image');
    const icon = this.getAttribute('icon');
    const description = this.innerHTML.trim();

    this.innerHTML = `
      <div class="class-card">
        <figure class="card-banner img-holder" style="--width: 416; --height: 240">
          <img src="${image}" width="416" height="240" loading="lazy" alt="${title}" class="img-cover" />
        </figure>
        <div class="card-content">
          <div class="title-wrapper">
            <img src="${icon}" width="52" height="52" aria-hidden="true" alt="" class="title-icon" />
            <h3 class="h3">
              <a href="#" class="card-title">${title}</a>
            </h3>
          </div>
          <p class="card-text">
            ${description}
          </p>
        </div>
      </div>
    `;
  }
}
customElements.define('class-card', ClassCard);
