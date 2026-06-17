const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://nikolaevskie.ru').replace(/\/$/, '');

export const SEO = {
  siteUrl: SITE_URL,
  siteName: 'Николаевские бани',
  defaultTitle: 'Николаевские бани - Русские бани на дровах в Екатеринбурге',
  defaultDescription:
    'Николаевские бани в Екатеринбурге - настоящие русские бани на дровах с вековыми традициями. Бронирование онлайн, парение с вениками, отдых для души и тела.',
  defaultKeywords:
    'бани Екатеринбург, русская баня, баня на дровах, парение, веники, отдых, Николаевские бани, бронирование бани',
  defaultOgImage: `${SITE_URL}/img/Logo.png`,
  locale: 'ru_RU',
  telephone: '+73433448755',
  email: 'nikolaevskiebani@yandex.ru',
  address: {
    streetAddress: 'ул. Кизеловская, 18',
    addressLocality: 'Екатеринбург',
    addressCountry: 'RU',
  },
  geo: {
    latitude: 56.823991,
    longitude: 60.539138,
  },
};

export const absoluteUrl = (path = '/') => {
  if (!path) return SEO.siteUrl;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SEO.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default SEO;
