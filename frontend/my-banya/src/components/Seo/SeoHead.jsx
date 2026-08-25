import { Helmet } from 'react-helmet-async';
import SEO, { absoluteUrl, websiteJsonLd, siteNavigationJsonLd } from '../../config/seo';

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.keywords]
 * @param {string} [props.canonical] - path or full URL
 * @param {string} [props.ogImage]
 * @param {string} [props.ogType]
 * @param {boolean} [props.noindex]
 * @param {Object|Object[]} [props.jsonLd]
 */
function SeoHead({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) {
  const pageTitle = title || SEO.defaultTitle;
  const pageDescription = description || SEO.defaultDescription;
  const pageKeywords = keywords || SEO.defaultKeywords;
  const canonicalUrl = canonical ? absoluteUrl(canonical) : undefined;
  const imageUrl = ogImage ? absoluteUrl(ogImage) : SEO.defaultOgImage;
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
  const geoPosition = `${SEO.geo.latitude};${SEO.geo.longitude}`;

  const jsonLdItems = [
    ...(noindex ? [] : [websiteJsonLd(), siteNavigationJsonLd()]),
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ];

  return (
    <Helmet>
      <html lang="ru" />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="author" content={SEO.siteName} />
      <meta name="robots" content={robotsContent} />
      <meta name="geo.region" content={SEO.geo.region} />
      <meta name="geo.placename" content={SEO.geo.placename} />
      <meta name="geo.position" content={geoPosition} />
      <meta name="ICBM" content={`${SEO.geo.latitude}, ${SEO.geo.longitude}`} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="ru" href={canonicalUrl} />}

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:locale" content={SEO.locale} />
      <meta property="og:site_name" content={SEO.siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}

      <meta property="vk:image" content={imageUrl} />

      {jsonLdItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

export default SeoHead;
