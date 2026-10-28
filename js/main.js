const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (menuToggle && nav) {
  const menuLabel = menuToggle.querySelector('.sr-only');

  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    if (menuLabel) menuLabel.textContent = isOpen ? 'Cerrar menú' : 'Abrir menú';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      if (menuLabel) menuLabel.textContent = 'Abrir menú';
    });
  });
}

const subjectTabs = [...document.querySelectorAll('[data-subject-tab]')];
const subjectPanels = [...document.querySelectorAll('.assignment-block[role="tabpanel"]')];

const selectSubject = (subject, preservePosition = true) => {
  const selectedTab = subjectTabs.find((tab) => tab.dataset.subjectTab === subject);
  const selectedPanel = subjectPanels.find((panel) => panel.id === subject);
  if (!selectedTab || !selectedPanel) return false;

  const tabList = selectedTab.closest('[role="tablist"]');
  const previousTop = tabList?.getBoundingClientRect().top ?? 0;
  const previousScroll = window.scrollY;

  subjectTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    tab.classList.toggle('is-active', isSelected);
  });

  subjectPanels.forEach((panel) => {
    const isSelected = panel === selectedPanel;
    panel.hidden = !isSelected;
    panel.classList.toggle('is-active', isSelected);
  });

  if (preservePosition && tabList) {
    window.requestAnimationFrame(() => {
      const currentTop = tabList.getBoundingClientRect().top;
      window.scrollTo(0, previousScroll + currentTop - previousTop);
    });
  }

  return true;
};

subjectTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    selectSubject(tab.dataset.subjectTab);
  });

  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? subjectTabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : subjectTabs.length - 1)) % subjectTabs.length;

    subjectTabs[nextIndex].focus();
    subjectTabs[nextIndex].click();
  });
});

const activateSubjectFromHash = () => {
  if (!subjectPanels.length) return;
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  const panel = target?.closest('.assignment-block[role="tabpanel"]');
  if (panel && panel.hidden) selectSubject(panel.id, false);
};

document.querySelectorAll('[data-subject-select]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const subject = link.dataset.subjectSelect;
    if (!selectSubject(subject, false)) return;
    event.preventDefault();
    window.history.pushState(null, '', `#${subject}`);
    document.getElementById(subject)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  });
});

window.addEventListener('hashchange', activateSubjectFromHash);
activateSubjectFromHash();

const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const pointerTiltSelector = [
  '.visual-frame',
  '.chrome-title',
  '.mission-box',
  '.value-card',
  '.story-panel',
  '.feature-scene',
  '.network-panel',
  '.opinion-feature',
  '.opinion-context',
  '.mini-opinion',
  '.article-hero-art',
  '.assignment-piece:not(.assignment-cluster)',
  '.comparison-column',
  '.thesis-slot',
  '.cybercrime-slot',
  '.influencer-text-slot',
  '.influencer-map-card',
  '.profile-card',
  '.gallery-slot',
  '.related-list article',
  '.news-card',
  '[data-detail]'
].join(', ');
const pointerTiltElements = new WeakSet();
const hasTiltPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceTiltMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const addPointerTilt = (element) => {
  if (pointerTiltElements.has(element) || !hasTiltPointer || reduceTiltMotion.matches) return;
  pointerTiltElements.add(element);
  element.classList.add('pointer-tilt');

  const sheen = document.createElement('span');
  sheen.className = 'pointer-sheen';
  sheen.setAttribute('aria-hidden', 'true');
  element.appendChild(sheen);

  const resetTilt = () => {
    element.style.removeProperty('transform');
    element.style.removeProperty('--pointer-x');
    element.style.removeProperty('--pointer-y');
  };

  element.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    if (reduceTiltMotion.matches) {
      resetTilt();
      return;
    }
    if (!(event.target instanceof Element) || event.target.closest('.pointer-tilt') !== element) {
      resetTilt();
      return;
    }

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * 6;
    const rotateX = (0.5 - y) * 6;
    element.style.setProperty('--pointer-x', `${x * 100}%`);
    element.style.setProperty('--pointer-y', `${y * 100}%`);
    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px) scale(1.008)`;
  });

  element.addEventListener('pointerleave', () => {
    resetTilt();
  });
};

const initializePointerTilt = (root = document) => {
  if (root instanceof Element && root.matches(pointerTiltSelector)) addPointerTilt(root);
  root.querySelectorAll(pointerTiltSelector).forEach(addPointerTilt);
};

initializePointerTilt();
document.addEventListener('news:rendered', () => {
  initializePointerTilt(document.getElementById('news-list') || document);
});

const getDetailTitle = (card) => {
  const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) return heading.textContent.trim();

  const label = card.querySelector('.label, .meta-tag, figcaption');
  if (label) return label.textContent.trim();

  const sectionHeading = card.closest('section')?.querySelector('h1, h2, h3');
  if (sectionHeading) return sectionHeading.textContent.trim();

  return card.getAttribute('aria-label') || 'Contenido del proyecto';
};

const openDetail = (card) => {
  const title = card.dataset.detailTitle || getDetailTitle(card);
  const content = card.cloneNode(true);
  content.querySelectorAll('.pointer-sheen, button, input, textarea, select').forEach((element) => element.remove());
  content.classList.remove('pointer-tilt');
  content.removeAttribute('role');
  content.removeAttribute('tabindex');

  const source = new URL(window.location.href);
  const sourceTarget = card.id || card.closest('section[id]')?.id;
  if (sourceTarget) source.hash = sourceTarget;

  const params = new URLSearchParams({
    title,
    content: content.innerHTML,
    source: source.href
  });
  window.location.href = `detalle.html?${params.toString()}`;
};

document.querySelectorAll('[data-detail]').forEach((card) => {
  const hasInnerControl = card.querySelector('a, button, input, textarea, select');
  if (hasInnerControl) return;

  card.setAttribute('role', 'link');
  card.tabIndex = 0;
  card.setAttribute('aria-label', `Abrir contenido: ${getDetailTitle(card)}`);

  card.addEventListener('keydown', (event) => {
    if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    openDetail(card);
  });
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const card = event.target.closest('[data-detail]');
  if (!card || event.target.closest('[data-detail-ignore]')) return;
  if (event.target.closest('a, button, input, textarea, select')) return;

  event.preventDefault();
  openDetail(card);
});

const networkConfig = [
  { id: 'redes', label: 'Redes', x: 17, y: 27, size: 'medium', description: 'Las redes sociales reúnen espacios para publicar, conversar y descubrir contenidos. Al explorarlas, conviene considerar cómo participan las personas y las plataformas.' },
  { id: 'ai', label: 'IA', x: 27, y: 72, size: 'small', description: 'La inteligencia artificial comprende distintas técnicas y herramientas. Para analizar una aplicación concreta, pregunta qué tarea realiza, con qué límites y bajo qué supervisión.' },
  { id: 'sociedad', label: 'Sociedad', x: 50, y: 17, size: 'primary', description: 'Las personas usan, interpretan y cuestionan las tecnologías de maneras diversas. El contexto social ayuda a entender tanto sus posibilidades como sus efectos.' },
  { id: 'cultura', label: 'Cultura', x: 83, y: 29, size: 'medium', description: 'La cultura digital incluye formas de crear, comunicar y compartir. Las herramientas cambian; también importa cómo comunidades y autores les dan significado.' },
  { id: 'economia', label: 'Economía', x: 74, y: 72, size: 'small', description: 'La relación entre tecnología y economía invita a examinar el trabajo, los servicios y el acceso a herramientas sin asumir que sus beneficios se reparten por igual.' },
  { id: 'personas', label: 'Personas', x: 50, y: 87, size: 'small', description: 'Las decisiones humanas están presentes al diseñar, elegir y usar tecnología. La participación, la accesibilidad y la responsabilidad son parte de esa conversación.' }
];

const networkSvg = document.getElementById('network-svg');
const networkNodes = document.getElementById('network-nodes');
const networkTitle = document.getElementById('network-title');
const networkDescription = document.getElementById('network-description');
const resetButton = document.getElementById('reset-network');

if (networkSvg && networkNodes && networkTitle && networkDescription) {
  const lines = [
    ['redes', 'ai'],
    ['redes', 'sociedad'],
    ['redes', 'cultura'],
    ['ai', 'economia'],
    ['sociedad', 'personas'],
    ['cultura', 'personas'],
    ['economia', 'sociedad'],
    ['cultura', 'ai']
  ];

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(svgNamespace, 'defs');
  const gradient = document.createElementNS(svgNamespace, 'linearGradient');
  gradient.setAttribute('id', 'network-link-gradient');
  gradient.setAttribute('x1', '0');
  gradient.setAttribute('x2', '1');
  [
    ['0', '#43e4ef'],
    ['0.55', '#8a8bff'],
    ['1', '#d9eaff']
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS(svgNamespace, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    gradient.appendChild(stop);
  });
  defs.appendChild(gradient);
  networkSvg.appendChild(defs);

  const orbitGroup = document.createElementNS(svgNamespace, 'g');
  orbitGroup.setAttribute('class', 'network-orbits');
  [
    { rx: 300, ry: 188, rotate: -8 },
    { rx: 390, ry: 248, rotate: 12 }
  ].forEach(({ rx, ry, rotate }) => {
    const orbit = document.createElementNS(svgNamespace, 'ellipse');
    orbit.setAttribute('cx', '500');
    orbit.setAttribute('cy', '310');
    orbit.setAttribute('rx', String(rx));
    orbit.setAttribute('ry', String(ry));
    orbit.setAttribute('transform', `rotate(${rotate} 500 310)`);
    orbit.setAttribute('class', 'network-orbit-line');
    orbitGroup.appendChild(orbit);
  });
  networkSvg.appendChild(orbitGroup);

  const spokeGroup = document.createElementNS(svgNamespace, 'g');
  spokeGroup.setAttribute('class', 'network-spokes');
  networkConfig.forEach((node) => {
    const spoke = document.createElementNS(svgNamespace, 'path');
    spoke.setAttribute('d', `M 500 310 L ${node.x * 10} ${node.y * 6.2}`);
    spoke.setAttribute('class', 'network-spoke');
    spoke.dataset.to = node.id;
    spokeGroup.appendChild(spoke);
  });
  networkSvg.appendChild(spokeGroup);

  const lineGroup = document.createElementNS(svgNamespace, 'g');
  lineGroup.setAttribute('class', 'network-lines');

  lines.forEach(([fromId, toId]) => {
    const from = networkConfig.find((node) => node.id === fromId);
    const to = networkConfig.find((node) => node.id === toId);

    if (!from || !to) return;

    const x1 = from.x * 10;
    const y1 = from.y * 6.2;
    const x2 = to.x * 10;
    const y2 = to.y * 6.2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const curve = 22;
    const controlX = (x1 + x2) / 2 - (dy / length) * curve;
    const controlY = (y1 + y2) / 2 + (dx / length) * curve;
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`);
    path.setAttribute('class', 'network-link');
    path.dataset.from = fromId;
    path.dataset.to = toId;
    lineGroup.appendChild(path);
  });

  networkSvg.appendChild(lineGroup);

  const nodeButtons = new Map();
  networkConfig.forEach((node) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `network-node network-node--${node.size}`;
    button.dataset.key = node.id;
    button.style.setProperty('--node-x', `${node.x}%`);
    button.style.setProperty('--node-y', `${node.y}%`);
    button.style.setProperty('--float-delay', `${-((node.x + node.y) % 8)}s`);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-describedby', 'network-description');

    const surface = document.createElement('span');
    surface.className = 'network-node-surface';
    const beacon = document.createElement('span');
    beacon.className = 'network-node-beacon';
    beacon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'network-node-label';
    label.textContent = node.label;
    surface.append(beacon, label);
    button.appendChild(surface);
    networkNodes.appendChild(button);
    nodeButtons.set(node.id, button);
    initializePointerTilt(surface);
  });

  const selectNode = (node, button) => {
    networkTitle.textContent = node.label;
    networkDescription.textContent = node.description;

    nodeButtons.forEach((candidate) => {
      const isActive = candidate === button;
      candidate.classList.toggle('is-active', isActive);
      candidate.setAttribute('aria-pressed', String(isActive));
    });
    networkSvg.querySelectorAll('.network-link, .network-spoke').forEach((path) => {
      path.classList.toggle('is-active', path.dataset.from === node.id || path.dataset.to === node.id);
    });
  };

  networkConfig.forEach((node) => {
    const button = nodeButtons.get(node.id);
    if (!button) return;
    const activate = () => selectNode(node, button);
    button.addEventListener('focus', activate);
    button.addEventListener('click', activate);
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const defaultNode = networkConfig.find((node) => node.id === 'sociedad');
      const defaultButton = nodeButtons.get('sociedad');
      if (defaultNode && defaultButton) selectNode(defaultNode, defaultButton);
    });
  }

  const defaultNode = networkConfig.find((node) => node.id === 'sociedad');
  const defaultButton = nodeButtons.get('sociedad');
  if (defaultNode && defaultButton) {
    selectNode(defaultNode, defaultButton);
  }
}
