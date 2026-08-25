const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://nikolaevskie.ru').replace(/\/$/, '');

export const SEO = {
  siteUrl: SITE_URL,
  siteName: 'Николаевские бани',
  defaultTitle: 'Бани в Екатеринбурге (ЕКБ) на дровах — Николаевские бани',
  defaultDescription:
    'Бани в Екатеринбурге (ЕКБ): русские парные на дровах, парение с вениками, купель. Николаевские бани, ул. Кизеловская, 18. Круглосуточно, бронирование онлайн.',
  defaultKeywords:
    'бани екб, бани Екатеринбург, русская баня Екатеринбург, баня на дровах, сауна Екатеринбург, Николаевские бани, парение, баня ВИЗ, Кизеловская 18, забронировать баню',
  defaultOgImage: `${SITE_URL}/img/Logo.png`,
  locale: 'ru_RU',
  telephone: '+73433448755',
  telephoneDisplay: '+7 (343) 344-87-55',
  email: 'nikolaevskiebani@yandex.ru',
  address: {
    streetAddress: 'ул. Кизеловская, 18',
    addressLocality: 'Екатеринбург',
    addressRegion: 'Свердловская область',
    addressCountry: 'RU',
  },
  geo: {
    latitude: 56.823991,
    longitude: 60.539138,
    region: 'RU-SVE',
    placename: 'Екатеринбург',
  },
  yandexMapsUrl: 'https://yandex.ru/maps/org/nikolaevskie_bani/161686163749/',
  /** Актуальные цифры с Яндекс Карт — обновлять вручную */
  aggregateRating: {
    ratingValue: '4.7',
    reviewCount: 96,
    ratingCount: 217,
    bestRating: '5',
  },
};

export const PAGES = {
  home: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    keywords: SEO.defaultKeywords,
  },
  baths: {
    title: 'Бани в Екатеринбурге — выбрать парную на дровах',
    description:
      'Русские бани на дровах в Екатеринбурге (ЕКБ): парные Николаевских бань, цены и вместимость. Выберите баню и забронируйте онлайн, ул. Кизеловская, 18.',
    keywords:
      'бани екб, бани Екатеринбург, русская баня, баня на дровах Екатеринбург, выбрать баню, парная, Николаевские бани',
  },
  booking: {
    title: 'Забронировать баню в Екатеринбурге (ЕКБ) онлайн',
    description:
      'Онлайн-бронирование бани в Екатеринбурге. Выберите дату, время и парную — Николаевские бани, ул. Кизеловская, 18.',
    keywords:
      'забронировать баню екб, бронирование бани Екатеринбург, баня онлайн, Николаевские бани',
  },
  contacts: {
    title: 'Контакты бань в Екатеринбурге — Кизеловская 18',
    description:
      'Адрес Николаевских бань в Екатеринбурге (ЕКБ): ул. Кизеловская, 18. Телефон +7 (343) 344-87-55. Как добраться, карта, бронирование.',
    keywords:
      'бани екб контакты, баня Кизеловская 18, адрес бани Екатеринбург, телефон бани ВИЗ, как добраться',
  },
};

export const SITELINKS = [
  { name: 'Бани', path: '/baths' },
  { name: 'Бронирование', path: '/booking' },
  { name: 'Контакты', path: '/contacts' },
];

export const absoluteUrl = (path = '/') => {
  if (!path) return SEO.siteUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SEO.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const organizationId = () => `${SEO.siteUrl}/#organization`;
export const websiteId = () => `${SEO.siteUrl}/#website`;

export const websiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': websiteId(),
  url: SEO.siteUrl,
  name: SEO.siteName,
  alternateName: ['Бани ЕКБ', 'Бани Екатеринбург', 'Николаевские бани Екатеринбург'],
  description: SEO.defaultDescription,
  inLanguage: 'ru-RU',
  publisher: { '@id': organizationId() },
});

export const siteNavigationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Быстрые ссылки',
  itemListElement: SITELINKS.map((link, index) => ({
    '@type': 'SiteNavigationElement',
    position: index + 1,
    name: link.name,
    url: absoluteUrl(link.path),
  })),
});

export const breadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const localBusinessJsonLd = (extra = {}) => ({
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'HealthAndBeautyBusiness'],
  '@id': organizationId(),
  name: SEO.siteName,
  alternateName: 'Бани в Екатеринбурге Николаевские',
  url: absoluteUrl('/'),
  image: SEO.defaultOgImage,
  logo: SEO.defaultOgImage,
  telephone: SEO.telephone,
  email: SEO.email,
  priceRange: '₽₽',
  currenciesAccepted: 'RUB',
  openingHours: 'Mo-Su 00:00-23:59',
  hasMap: SEO.yandexMapsUrl,
  areaServed: {
    '@type': 'City',
    name: 'Екатеринбург',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: SEO.address.streetAddress,
    addressLocality: SEO.address.addressLocality,
    addressRegion: SEO.address.addressRegion,
    addressCountry: SEO.address.addressCountry,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: SEO.geo.latitude,
    longitude: SEO.geo.longitude,
  },
  sameAs: [SEO.yandexMapsUrl],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: SEO.aggregateRating.ratingValue,
    reviewCount: SEO.aggregateRating.reviewCount,
    ratingCount: SEO.aggregateRating.ratingCount,
    bestRating: SEO.aggregateRating.bestRating,
  },
  ...extra,
});

export default SEO;
