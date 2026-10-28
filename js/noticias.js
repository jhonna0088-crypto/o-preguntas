const newsList = document.getElementById('news-list');
const newsStatus = document.getElementById('news-status');
const newsUpdateNote = document.getElementById('news-update-note');

const isIsoDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

const validateNewsItem = (item, ids) => {
  const requiredText = [
    'id',
    'title',
    'originalTitle',
    'summary',
    'source',
    'category',
    'image',
    'imageAlt',
    'url'
  ];
  if (!item || requiredText.some((key) => typeof item[key] !== 'string' || !item[key].trim())) {
    throw new TypeError('Hay una noticia con campos obligatorios vacíos en data/noticias.json.');
  }
  if (!/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) {
    throw new TypeError(`El identificador de noticia "${item.id}" no es válido o está repetido.`);
  }
  if (!isIsoDate(item.publishedAt)) {
    throw new TypeError(`La fecha de publicación de "${item.id}" debe usar el formato AAAA-MM-DD.`);
  }

  const articleUrl = new URL(item.url, window.location.href);
  const imageUrl = new URL(item.image, window.location.href);
  const localAssetsPath = new URL('assets/images/', window.location.href).pathname;
  if (articleUrl.protocol !== 'https:' || articleUrl.origin === window.location.origin) {
    throw new TypeError(`El enlace de "${item.id}" debe llevar a una fuente externa HTTPS.`);
  }
  if (
    imageUrl.origin !== window.location.origin ||
    !imageUrl.pathname.startsWith(localAssetsPath)
  ) {
    throw new TypeError(`La imagen de "${item.id}" debe estar dentro de assets/images/.`);
  }

  ids.add(item.id);
};

const validateNewsData = (data) => {
  if (!data || !isIsoDate(data.checkedAt) || !Array.isArray(data.items)) {
    throw new TypeError('data/noticias.json debe incluir checkedAt y una lista items.');
  }

  const ids = new Set();
  data.items.forEach((item) => validateNewsItem(item, ids));
  return data;
};

const createText = (tagName, className, text) => {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
};

const formatDate = (date) => {
  const value = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(value);
};

const createNewsCard = (item, featured = false) => {
  const article = document.createElement('article');
  article.className = `news-card${featured ? ' news-card--featured' : ''}`;
  article.dataset.newsId = item.id;

  const link = document.createElement('a');
  link.className = 'news-card__link';
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Leer en ${item.source}: ${item.title}. Se abre en una pestaña nueva.`);

  const figure = document.createElement('figure');
  figure.className = 'news-card__visual';
  const image = document.createElement('img');
  image.src = item.image;
  image.alt = item.imageAlt;
  image.loading = featured ? 'eager' : 'lazy';
  figure.append(image, createText('figcaption', 'news-card__image-note', 'Imagen ilustrativa · No es una fotografía del acontecimiento'));

  const content = document.createElement('div');
  content.className = 'news-card__content';
  content.appendChild(createText('span', 'meta-tag news-card__category', item.category));

  const metadata = document.createElement('p');
  metadata.className = 'news-card__metadata';
  metadata.append(
    createText('span', 'news-card__source', item.source),
    document.createTextNode(' · ')
  );
  const published = document.createElement('time');
  published.dateTime = item.publishedAt;
  published.textContent = formatDate(item.publishedAt);
  metadata.appendChild(published);

  content.append(
    metadata,
    createText('h3', 'news-card__title', item.title),
    createText('p', 'news-card__original', `Titular original: ${item.originalTitle}`),
    createText('p', 'news-card__summary', item.summary),
    createText('span', 'news-card__read', `Leer el artículo original en ${item.source} ↗`)
  );

  link.append(figure, content);
  article.appendChild(link);
  return article;
};

const renderNews = (data) => {
  if (!newsList || !newsStatus || !newsUpdateNote) return;
  const cards = document.createDocumentFragment();

  if (data.items.length === 0) {
    newsStatus.textContent = 'Todavía no hay noticias en la lista. Puedes agregar publicaciones verificadas en data/noticias.json.';
    newsUpdateNote.textContent = 'La lista se mantiene manualmente en data/noticias.json.';
    return;
  }

  const featuredIndex = Math.max(0, data.items.findIndex((item) => item.featured === true));
  cards.appendChild(createNewsCard(data.items[featuredIndex], true));
  data.items.forEach((item, index) => {
    if (index !== featuredIndex) cards.appendChild(createNewsCard(item));
  });

  newsList.replaceChildren(cards);
  newsUpdateNote.textContent = `Selección revisada el ${formatDate(data.checkedAt)}. Lista mantenida manualmente en data/noticias.json; consulta cada fuente para ver el artículo completo.`;
  document.dispatchEvent(new Event('news:rendered'));
};

const showNewsError = (error) => {
  if (newsStatus) {
    newsStatus.textContent = 'No se pudo cargar la lista de noticias. Abre el sitio con un servidor web local, como Live Server, y comprueba que data/noticias.json esté disponible.';
  }
  console.error('No se pudo cargar la lista local de noticias:', error);
};

if (newsList && newsStatus && newsUpdateNote) {
  const scriptUrl = document.currentScript?.src || window.location.href;
  const newsDataUrl = new URL('../data/noticias.json', scriptUrl);

  fetch(newsDataUrl, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`data/noticias.json respondió con el estado ${response.status}.`);
      }
      return response.json();
    })
    .then(validateNewsData)
    .then(renderNews)
    .catch(showNewsError);
}
