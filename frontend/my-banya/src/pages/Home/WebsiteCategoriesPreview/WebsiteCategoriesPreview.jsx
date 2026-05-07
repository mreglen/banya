import { useState } from 'react';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';

function WebsiteCategoriesPreview() {
  const { data: categories = [] } = useGetWebsiteCategoriesPreviewQuery();
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <>
      {categories.map((category, idx) => {
        const sectionId = `site-category-${category.id}`;
        const isDark = idx % 2 === 1;

        return (
          <section
            key={category.id}
            id={sectionId}
            className={
              isDark
                ? 'bg-gray-900 border-t border-gray-800 py-20 md:py-28'
                : 'bg-gray-50 py-20 md:py-28'
            }
          >
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2
                  className={`text-3xl sm:text-4xl md:text-5xl font-light mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {category.name}
                </h2>
                <p
                  className={`text-lg font-extralight max-w-2xl mx-auto ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Раздел категории на сайте. Отображаются только отмеченные товары.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 mt-12">
                {category.products
                  .slice(0, expandedCategories[category.id] ? category.products.length : 3)
                  .map((product) => (
                  <div
                    key={product.id}
                    className={`w-full md:w-[calc(33.333%-1rem)] ${
                      isDark
                        ? 'bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-700'
                        : 'bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100'
                    }`}
                  >
                    <h3
                      className={`text-xl font-medium mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {product.name}
                    </h3>
                    <p
                      className={`text-sm mb-4 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      {product.description || 'Без описания'}
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    >
                      {(product.price ?? 0).toFixed(2)} ₽
                    </p>
                  </div>
                ))}
              </div>

              {category.products.length > 3 && (
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                      isDark ? 'shadow-md shadow-black/30' : ''
                    }`}
                  >
                    {expandedCategories[category.id] ? 'Скрыть' : 'Показать больше'}
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

export default WebsiteCategoriesPreview;
