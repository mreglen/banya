import { useCallback, useEffect, useState } from 'react';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';

const SERVER_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : window.location.origin || 'http://127.0.0.1:8000';

const MAX_CARDS = 3;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return imageUrl.startsWith('/') ? `${SERVER_BASE_URL}${imageUrl}` : `${SERVER_BASE_URL}/${imageUrl}`;
};

function useIsDesktopMd() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

function CategoryProductCard({ product, isDark }) {
  const [slide, setSlide] = useState(0);
  const isDesktop = useIsDesktopMd();

  const productPhoto = toAbsoluteImageUrl(product.photos?.[0]?.image_url);
  const goPrev = useCallback(() => setSlide((s) => (s === 0 ? 1 : 0)), []);
  const goNext = useCallback(() => setSlide((s) => (s === 0 ? 1 : 0)), []);

  const nameCls = 'text-white drop-shadow-md';
  const detailText = isDark ? 'text-gray-100' : 'text-gray-100';

  return (
    <div
      className={`group relative rounded-xl overflow-hidden shadow-md border ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      } h-[200px] sm:h-[220px] md:h-[240px] select-none`}
    >
      {/* Mobile: horizontal scroll between «фото» и «детали» */}
      <div
        className={`h-full w-full ${
          isDesktop ? 'overflow-hidden' : 'overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex no-scrollbar'
        }`}
      >
        <div
          className="flex h-full w-[200%]"
          style={
            isDesktop
              ? { transform: `translateX(-${slide * 50}%)`, transition: 'transform 0.35s ease' }
              : undefined
          }
        >
          <div className="relative h-full w-1/2 shrink-0 snap-center snap-always">
            {productPhoto ? (
              <img
                src={productPhoto}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                Нет фото
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 pt-12">
              <h3 className={`${nameCls} text-2xl sm:text-3xl font-semibold leading-tight`}>{product.name}</h3>
            </div>
          </div>

          <div className="relative h-full w-1/2 shrink-0 snap-center snap-always">
            {productPhoto ? (
              <img
                src={productPhoto}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800" />
            )}
            <div className="absolute inset-0 bg-black/72" />
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <p className={`text-base sm:text-lg font-medium leading-snug ${detailText}`}>
                {product.description || 'Без описания'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-400 shrink-0">
                {(product.price ?? 0).toFixed(2)} ₽
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: большие стрелки по краям при наведении */}
      {isDesktop && (
        <>
          <button
            type="button"
            aria-label="Предыдущий экран"
            onClick={goPrev}
            className="absolute left-0 top-0 z-10 h-full w-[28%] max-w-[120px] flex items-center justify-start pl-2 bg-gradient-to-r from-black/45 to-transparent opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200"
          >
            <span className="text-white/95 drop-shadow-lg scale-150 md:scale-[1.75]">
              <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </button>
          <button
            type="button"
            aria-label="Следующий экран"
            onClick={goNext}
            className="absolute right-0 top-0 z-10 h-full w-[28%] max-w-[120px] flex items-center justify-end pr-2 bg-gradient-to-l from-black/45 to-transparent opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200"
          >
            <span className="text-white/95 drop-shadow-lg scale-150 md:scale-[1.75]">
              <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </>
      )}
    </div>
  );
}

function WebsiteCategoriesPreview() {
  const { data: categories = [] } = useGetWebsiteCategoriesPreviewQuery();
  const [expandedByCategory, setExpandedByCategory] = useState({});

  const toggleCategoryExpand = (categoryId) => {
    setExpandedByCategory((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {categories.map((category, idx) => {
        const sectionId = `site-category-${category.id}`;
        const isDark = idx % 2 === 1;
        const categoryBackground = toAbsoluteImageUrl(category.photos?.[0]?.image_url);
        const expanded = Boolean(expandedByCategory[category.id]);
        const products = category.products || [];
        const hasMore = products.length > MAX_CARDS;
        const visibleProducts = expanded || !hasMore ? products : products.slice(0, MAX_CARDS);

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

              <div className="mt-12 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {visibleProducts.map((product) => (
                    <CategoryProductCard key={product.id} product={product} isDark={isDark} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(category.id)}
                      className={`px-8 py-3 rounded-full text-sm font-medium tracking-wide transition-colors ${
                        categoryBackground || isDark
                          ? 'bg-white/15 text-white border border-white/30 hover:bg-white/25'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {expanded ? 'Скрыть' : 'Показать больше'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

export default WebsiteCategoriesPreview;
