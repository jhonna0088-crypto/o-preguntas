const detailView = document.getElementById('detail-view');
const detailError = document.getElementById('detail-error');
const detailTitle = document.getElementById('detail-title');
const detailContent = document.getElementById('detail-content');
const detailNotice = document.getElementById('detail-notice');
const detailSourceLink = document.getElementById('detail-source-link');

if (detailView && detailError && detailTitle && detailContent && detailNotice && detailSourceLink) {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title');
  const content = params.get('content');
  const source = params.get('source');

  if (!title || !content) {
    detailError.hidden = false;
  } else {
    const parsedContent = new DOMParser().parseFromString(content, 'text/html');

    parsedContent
      .querySelectorAll('script, style, iframe, object, embed, form, button, input, textarea, select, svg, math, link, meta, .pointer-sheen')
      .forEach((element) => element.remove());

    parsedContent.querySelectorAll('a').forEach((anchor) => {
      anchor.replaceWith(...anchor.childNodes);
    });

    parsedContent.querySelectorAll('*').forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (attribute.name === 'class' && attribute.value !== 'meta-tag') {
          element.removeAttribute(attribute.name);
          return;
        }

        if (attribute.name === 'src') {
          const imageUrl = new URL(attribute.value, window.location.href);
          const assetsUrl = new URL('assets/', window.location.href);
          if (
            imageUrl.protocol !== window.location.protocol ||
            imageUrl.origin !== window.location.origin ||
            !imageUrl.pathname.startsWith(assetsUrl.pathname)
          ) {
            element.removeAttribute(attribute.name);
          } else {
            element.setAttribute('src', imageUrl.href);
          }
          return;
        }

        if (!['alt', 'title', 'loading'].includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    const contentHeading = parsedContent.querySelector('h1, h2, h3, h4, h5, h6, .label, .meta-tag, figcaption');
    if (contentHeading && contentHeading.textContent.trim() === title) {
      contentHeading.remove();
    }

    detailTitle.textContent = title;
    detailContent.innerHTML = parsedContent.body.innerHTML;
    detailNotice.hidden = detailContent.textContent.trim().length >= 70;
    detailView.hidden = false;

    if (source) {
      const sourceUrl = new URL(source, window.location.href);
      const projectDirectory = new URL('.', window.location.href).pathname;

      if (
        sourceUrl.protocol === window.location.protocol &&
        sourceUrl.origin === window.location.origin &&
        sourceUrl.pathname.startsWith(projectDirectory) &&
        sourceUrl.pathname.endsWith('.html')
      ) {
        detailSourceLink.href = `${sourceUrl.pathname}${sourceUrl.search}${sourceUrl.hash}`;
        detailSourceLink.hidden = false;
      }
    }
  }
}
