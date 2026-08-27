/**
 * После сборки CRA кладёт один index.html на все URL.
 * Робот Яндекса часто не ждёт React и видит пустой #root.
 * Скрипт делает отдельные HTML с текстом, мета и schema для ключевых страниц.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://nikolaevskie.ru').replace(/\/$/, '');
const API_URL = process.env.PRERENDER_API_URL || 'http://127.0.0.1:8000/api/baths/';

const SEO = {
  siteName: 'Николаевские бани',
  telephone: '+73433448755',
  telephoneDisplay: '+7 (343) 344-87-55',
  email: 'nikolaevskiebani@yandex.ru',
  address: 'ул. Кизеловская, 18',
  city: 'Екатеринбург',
  maps: 'https://yandex.ru/maps/org/nikolaevskie_bani/161686163749/',
  rating: { value: '4.7', reviews: 96, ratings: 217 },
};

const NAV = [
  { href: '/', name: 'Главная' },
  { href: '/baths', name: 'Бани' },
  { href: '/booking', name: 'Бронирование' },
  { href: '/contacts', name: 'Контакты' },
];

const PAGES = {
  home: {
    path: '/',
    title: 'Бани в Екатеринбурге (ЕКБ) на дровах — Николаевские бани',
    description:
      'Бани в Екатеринбурге (ЕКБ): русские парные на дровах, парение с вениками, купель. Николаевские бани, ул. Кизеловская, 18. Круглосуточно, бронирование онлайн.',
    keywords:
      'бани екб, бани Екатеринбург, русская баня Екатеринбург, баня на дровах, сауна Екатеринбург, Николаевские бани, парение, баня ВИЗ, Кизеловская 18, забронировать баню',
    h1: 'Николаевские бани — бани в Екатеринбурге (ЕКБ)',
    paragraphs: [
      'Русские бани на дровах в Екатеринбурге (ЕКБ). Парение с вениками, купель, работаем круглосуточно.',
      `Адрес: г. ${SEO.city}, ${SEO.address}. Телефон: ${SEO.telephoneDisplay}.`,
    ],
  },
  baths: {
    path: '/baths',
    title: 'Бани в Екатеринбурге — выбрать парную на дровах',
    description:
      'Русские бани на дровах в Екатеринбурге (ЕКБ): парные Николаевских бань, цены и вместимость. Выберите баню и забронируйте онлайн, ул. Кизеловская, 18.',
    keywords:
      'бани екб, бани Екатеринбург, русская баня, баня на дровах Екатеринбург, выбрать баню, парная, Николаевские бани',
    h1: 'Бани в Екатеринбурге',
    paragraphs: [
      'Русские парные на дровах в ЕКБ. Выберите баню и забронируйте онлайн.',
      `Николаевские бани, ${SEO.address}, ${SEO.city}.`,
    ],
  },
  booking: {
    path: '/booking',
    title: 'Забронировать баню в Екатеринбурге (ЕКБ) онлайн',
    description:
      'Онлайн-бронирование бани в Екатеринбурге. Выберите дату, время и парную — Николаевские бани, ул. Кизеловская, 18.',
    keywords:
      'забронировать баню екб, бронирование бани Екатеринбург, баня онлайн, Николаевские бани',
    h1: 'Забронировать баню в Екатеринбурге',
    paragraphs: [
      'Выберите дату, время и парную — подготовим баню к вашему приходу.',
      `Телефон: ${SEO.telephoneDisplay}.`,
    ],
  },
  contacts: {
    path: '/contacts',
    title: 'Контакты бань в Екатеринбурге — Кизеловская 18',
    description:
      'Адрес Николаевских бань в Екатеринбурге (ЕКБ): ул. Кизеловская, 18. Телефон +7 (343) 344-87-55. Как добраться, карта, бронирование.',
    keywords:
      'бани екб контакты, баня Кизеловская 18, адрес бани Екатеринбург, телефон бани ВИЗ, как добраться',
    h1: 'Контакты бань в Екатеринбурге',
    paragraphs: [
      `Адрес: г. ${SEO.city}, ${SEO.address} (ВИЗ).`,
      `Телефон: ${SEO.telephoneDisplay}. Email: ${SEO.email}.`,
      'Работаем круглосуточно. Есть парковка.',
    ],
  },
};

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 4000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

function navHtml() {
  return `<nav aria-label="Разделы сайта"><ul>${NAV.map(
    (item) => `<li><a href="${item.href}">${escapeHtml(item.name)}</a></li>`
  ).join('')}</ul></nav>`;
}

function pageBody(page, extraLinks = []) {
  const links = extraLinks
    .map((item) => `<li><a href="${escapeAttr(item.href)}">${escapeHtml(item.name)}</a></li>`)
    .join('');
  return `<div style="max-width:960px;margin:0 auto;padding:24px;font-family:sans-serif;color:#111">
${navHtml()}
<main>
<h1>${escapeHtml(page.h1)}</h1>
${page.paragraphs.map((p) => `<div>${escapeHtml(p)}</div>`).join('\n')}
${links ? `<ul>${links}</ul>` : ''}
<div><a href="tel:${SEO.telephone}">${SEO.telephoneDisplay}</a></div>
</main>
</div>`;
}

function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
    '@id': `${SITE_URL}/#organization`,
    name: SEO.siteName,
    url: SITE_URL,
    telephone: SEO.telephone,
    email: SEO.email,
    image: `${SITE_URL}/img/Logo.png`,
    openingHours: 'Mo-Su 00:00-23:59',
    hasMap: SEO.maps,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO.address,
      addressLocality: SEO.city,
      addressRegion: 'Свердловская область',
      addressCountry: 'RU',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SEO.rating.value,
      reviewCount: SEO.rating.reviews,
      ratingCount: SEO.rating.ratings,
      bestRating: '5',
    },
    sameAs: [SEO.maps],
  };
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    name: SEO.siteName,
    inLanguage: 'ru-RU',
  };
}

function navigationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Быстрые ссылки',
    itemListElement: NAV.slice(1).map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.href}`,
    })),
  };
}

function jsonLdScripts(objects) {
  return objects
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');
}

function setRoot(html, inner) {
  const startToken = '<div id="root">';
  const start = html.indexOf(startToken);
  if (start === -1) {
    throw new Error('В index.html нет #root');
  }
  let i = start + startToken.length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) {
        return `${html.slice(0, start)}<div id="root">${inner}</div>${html.slice(nextClose + 6)}`;
      }
      i = nextClose + 6;
    }
  }
  throw new Error('Не удалось закрыть #root');
}

function replaceMetaByAttr(html, attr, key, value) {
  const escaped = escapeAttr(value);
  const re = new RegExp(`(<meta\\s+${attr}="${key}"[\\s\\S]*?content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${escaped}$2`);
  const reFlip = new RegExp(`(<meta\\s+content=")[^"]*("[\\s\\S]*?${attr}="${key}")`, 'i');
  return html.replace(reFlip, `$1${escaped}$2`);
}

function setMeta(html, page) {
  const canonical = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  out = replaceMetaByAttr(out, 'name', 'description', page.description);
  out = replaceMetaByAttr(out, 'name', 'keywords', page.keywords);
  out = replaceMetaByAttr(out, 'property', 'og:title', page.title);
  out = replaceMetaByAttr(out, 'property', 'og:description', page.description);
  out = replaceMetaByAttr(out, 'property', 'og:url', canonical);
  out = replaceMetaByAttr(out, 'name', 'twitter:title', page.title);
  out = replaceMetaByAttr(out, 'name', 'twitter:description', page.description);
  out = replaceMetaByAttr(out, 'name', 'twitter:url', canonical);

  if (!/rel="canonical"/.test(out)) {
    out = out.replace('</title>', `</title>\n  <link rel="canonical" href="${escapeAttr(canonical)}" />`);
  } else {
    out = out.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${escapeAttr(canonical)}" />`
    );
  }

  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
  const schemas = [websiteJsonLd(), navigationJsonLd(), localBusinessJsonLd(), ...(page.extraJsonLd || [])];
  out = out.replace('</head>', `  ${jsonLdScripts(schemas)}\n</head>`);
  return out;
}

function writePage(relPath, html) {
  const filePath = path.join(BUILD_DIR, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  console.log('prerender:', relPath);
}

async function main() {
  const indexPath = path.join(BUILD_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Нет ${indexPath}. Сначала выполните react-scripts build.`);
  }
  const template = fs.readFileSync(indexPath, 'utf8');

  const home = PAGES.home;
  writePage(
    'index.html',
    setRoot(setMeta(template, home), pageBody(home, [
      { href: '/baths', name: 'Все бани' },
      { href: '/booking', name: 'Забронировать баню' },
      { href: '/contacts', name: 'Контакты и адрес' },
    ]))
  );

  const bathsData = await fetchJson(API_URL);
  const baths = Array.isArray(bathsData) ? bathsData : [];
  const bathLinks = baths
    .filter((bath) => bath.slug)
    .map((bath) => ({ href: `/baths/${bath.slug}`, name: bath.name || bath.slug }));

  writePage(
    path.join('baths', 'index.html'),
    setRoot(setMeta(template, PAGES.baths), pageBody(PAGES.baths, bathLinks))
  );
  writePage(
    path.join('booking', 'index.html'),
    setRoot(setMeta(template, PAGES.booking), pageBody(PAGES.booking, [{ href: '/baths', name: 'Выбрать баню' }]))
  );
  writePage(
    path.join('contacts', 'index.html'),
    setRoot(setMeta(template, PAGES.contacts), pageBody(PAGES.contacts, [{ href: SEO.maps, name: 'Яндекс Карты' }]))
  );

  baths.forEach((bath) => {
    if (!bath.slug) return;
    const description =
      (bath.description && String(bath.description).slice(0, 180)) ||
      `${bath.name} — русская баня на дровах в Екатеринбурге (ЕКБ). Николаевские бани.`;
    const page = {
      path: `/baths/${bath.slug}`,
      title: `${bath.name} — баня в Екатеринбурге | Николаевские бани`,
      description,
      keywords: `${bath.name}, баня Екатеринбург, бани екб, русская баня на дровах, Николаевские бани`,
      h1: bath.name || 'Баня',
      paragraphs: [
        bath.subtitle || bath.title || 'Русская баня на дровах в Екатеринбурге (ЕКБ).',
        description,
        `Адрес: г. ${SEO.city}, ${SEO.address}.`,
      ],
      extraJsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: bath.name,
          description,
          url: `${SITE_URL}/baths/${bath.slug}`,
          areaServed: 'Екатеринбург',
          provider: { '@id': `${SITE_URL}/#organization` },
        },
      ],
    };
    writePage(
      path.join('baths', bath.slug, 'index.html'),
      setRoot(setMeta(template, page), pageBody(page, [
        { href: '/booking', name: 'Забронировать' },
        { href: '/baths', name: 'Все бани' },
      ]))
    );
  });

  if (!baths.length) {
    console.warn('prerender: список бань недоступен (API), страницы /baths/:slug пропущены');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
