import { useState } from 'react';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';

const SERVER_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : window.location.origin || 'http://127.0.0.1:8000';

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return imageUrl.startsWith('/') ? `${SERVER_BASE_URL}${imageUrl}` : `${SERVER_BASE_URL}/${imageUrl}`;
};

function WebsiteCategoriesPreview() {
  const { data: categories = [] } = useGetWebsiteCategoriesPreviewQuery();
  const [productSlides, setProductSlides] = useState({});

  const slideKey = (categoryId, productId) => `${categoryId}-${productId}`;
  const setSlide = (categoryId, productId, value) => {
    const key = slideKey(categoryId, productId);
    setProductSlides((prev) => ({ ...prev, [key]: value }));
  };

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <>
      {categories.map((category, idx) => {
        const sectionId = `site-category-${category.id}`;
        const isDark = idx % 2 === 1;
        const categoryBackground = toAbsoluteImageUrl(category.photos?.[0]?.image_url);

        return (
          <section
            key={category.id}
            id={sectionId}
            className={`relative overflow-hidden py-20 md:py-28 ${
              isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50'
            }`}
            style={
              categoryBackground
                ? {
                    backgroundImage: `url("${categoryBackground}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {categoryBackground && <div className="absolute inset-0 bg-black/55" />}
            <div className="relative max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2
                  className={`text-3xl sm:text-4xl md:text-5xl font-light mb-4 ${
                    categoryBackground || isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {category.name}
                </h2>
                <p
                  className={`text-lg font-extralight max-w-2xl mx-auto ${
                    categoryBackground || isDark ? 'text-gray-200' : 'text-gray-600'
                  }`}
                >
                  Раздел категории на сайте. Отображаются только отмеченные товары.
                </p>
              </div>

              <div className="mt-12 overflow-x-auto pb-2">
                <div className="flex gap-6 w-max snap-x snap-mandatory">
                  {category.products.map((product) => {
                    const productPhoto = toAbsoluteImageUrl(product.photos?.[0]?.image_url);
                    const currentSlide = productSlides[slideKey(category.id, product.id)] || 0;

                    return (
                      <div
                        key={product.id}
                        className={`snap-start w-[280px] sm:w-[320px] ${
                          isDark
                            ? 'bg-gray-800 rounded-xl shadow-sm border border-gray-700'
                            : 'bg-white rounded-xl shadow-sm border border-gray-100'
                        } overflow-hidden`}
                      >
                        <div className="relative h-[360px] overflow-hidden">
                          <div
                            className="flex h-full transition-transform duration-300"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                          >
                            <div className="w-full h-full shrink-0 p-5 flex flex-col">
                              {productPhoto ? (
                                <img
                                  src={productPhoto}
                                  alt={product.name}
                                  className="w-full h-56 object-cover rounded-lg mb-4"
                                />
                              ) : (
                                <div className="w-full h-56 rounded-lg mb-4 bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                                  Нет фото
                                </div>
                              )}
                              <h3 className={`text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {product.name}
                              </h3>
                            </div>

                            <div className="w-full h-full shrink-0 p-5 flex flex-col justify-between">
                              <div>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {product.description || 'Без описания'}
                                </p>
                              </div>
                              <p className={`text-2xl font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {(product.price ?? 0).toFixed(2)} ₽
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`px-5 pb-5 pt-2 flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <button
                            type="button"
                            onClick={() => setSlide(category.id, product.id, 0)}
                            disabled={currentSlide === 0}
                            className="px-3 py-1.5 rounded-lg text-sm bg-gray-200 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Фото
                          </button>
                          <div className="flex gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${currentSlide === 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                            <span className={`h-2.5 w-2.5 rounded-full ${currentSlide === 1 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                          </div>
                          <button
                            type="button"
                            onClick={() => setSlide(category.id, product.id, 1)}
                            disabled={currentSlide === 1}
                            className="px-3 py-1.5 rounded-lg text-sm bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Детали
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

export default WebsiteCategoriesPreview;
