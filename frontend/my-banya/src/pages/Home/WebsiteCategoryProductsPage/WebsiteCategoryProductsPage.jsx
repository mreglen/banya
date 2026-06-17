import { Link, useParams } from 'react-router-dom';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';
import SeoHead from '../../../components/Seo/SeoHead';
import { absoluteUrl } from '../../../config/seo';
import SEO from '../../../config/seo';

function WebsiteCategoryProductsPage() {
  const { categoryId } = useParams();
  const { data: categories = [] } = useGetWebsiteCategoriesPreviewQuery();

  const category = categories.find((item) => String(item.id) === String(categoryId));

  if (!category) {
    return (
      <main className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">
        <SeoHead title="Категория не найдена" noindex />
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-light text-gray-900 mb-4">Категория не найдена</h1>
          <Link to="/" className="text-amber-600 hover:text-amber-700">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  const canonicalPath = `/categories/${category.id}/products`;
  const description = `Каталог «${category.name}» в Николаевских банях. ${category.products?.length || 0} позиций с ценами.`;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    url: absoluteUrl(canonicalPath),
    numberOfItems: category.products?.length || 0,
    itemListElement: (category.products || []).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description || undefined,
        offers: {
          '@type': 'Offer',
          price: product.price ?? 0,
          priceCurrency: 'RUB',
        },
      },
    })),
  };

  return (
    <main className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">
      <SeoHead
        title={`${category.name} - ${SEO.siteName}`}
        description={description}
        keywords={`${category.name}, ${SEO.siteName}, меню, услуги Екатеринбург`}
        canonical={canonicalPath}
        jsonLd={itemListJsonLd}
      />
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3">{category.name}</h1>
          <p className="text-gray-600">Полный список товаров, отображаемых на сайте.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {category.products.map((product) => (
            <article
              key={product.id}
              itemScope
              itemType="https://schema.org/Product"
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <h2 className="text-xl font-medium text-gray-900 mb-2" itemProp="name">
                {product.name}
              </h2>
              <p className="text-gray-600 text-sm mb-4" itemProp="description">
                {product.description || 'Без описания'}
              </p>
              <p className="text-lg font-semibold text-amber-600" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <data itemProp="price" value={product.price ?? 0}>
                  {(product.price ?? 0).toFixed(2)}
                </data>
                {' '}
                <span itemProp="priceCurrency" content="RUB">₽</span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default WebsiteCategoryProductsPage;
