import { useState } from 'react';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';
import { ChevronDown, ChevronUp, ShoppingBag, Info } from 'lucide-react';

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

function CategoryProductCard({ product }) {
  const productPhoto = toAbsoluteImageUrl(product.photos?.[0]?.image_url);

  return (
    <div className="group relative h-[320px] rounded-2xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
      {/* Background Image */}
      {productPhoto ? (
        <img
          src={productPhoto}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-500">
          Нет фото
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-95" />

      {/* Content Container */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end transition-all duration-500 group-hover:pb-8">
        {/* Title & Price (Always visible) */}
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-lg">
            {product.name}
          </h3>
          <div className="bg-amber-500 text-black px-3 py-1 rounded-lg font-bold text-sm sm:text-base transform transition-transform group-hover:scale-110">
            {(product.price ?? 0).toLocaleString()} ₽
          </div>
        </div>

        {/* Hidden Details (Visible on hover or simplified for mobile) */}
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
          <div className="pt-3 border-t border-white/20 mt-2">
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed line-clamp-3 italic">
              {product.description || 'Изысканный вкус и традиционное качество'}
            </p>
          </div>
        </div>

        {/* Action Button (Optional style) */}
        <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm font-semibold opacity-0 -translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-0">
          <Info size={16} />
          <span>Подробнее</span>
        </div>
      </div>
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
    <div className="space-y-0">
      {categories.map((category, idx) => {
        const sectionId = `site-category-${category.id}`;
        const isDark = idx % 2 === 1;
        const categoryBackground = toAbsoluteImageUrl(category.photos?.[0]?.image_url);
        const expanded = Boolean(expandedByCategory[category.id]);
        const products = category.products || [];
        const hasMore = products.length > MAX_CARDS;
        const visibleProducts = expanded ? products : products.slice(0, MAX_CARDS);

        return (
          <section
            key={category.id}
            id={sectionId}
            className={`relative py-24 md:py-32 overflow-hidden ${
              isDark ? 'bg-zinc-950' : 'bg-white'
            }`}
          >
            {/* Background Image with Parallax-like feel */}
            {categoryBackground && (
              <div 
                className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
                style={{
                  backgroundImage: `url("${categoryBackground}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed'
                }}
              />
            )}
            
            {/* Overlay for better contrast */}
            <div className={`absolute inset-0 z-0 ${isDark ? 'bg-zinc-950/80' : 'bg-white/90'}`} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
              {/* Category Header */}
              <div className="text-center mb-20">
                <div className="inline-block mb-4">
                  <div className={`h-1 w-12 mx-auto rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'}`} />
                </div>
                <h2 className={`text-4xl sm:text-5xl md:text-6xl font-light tracking-tight mb-6 ${
                  isDark ? 'text-white' : 'text-zinc-900'
                }`}>
                  {category.name}
                </h2>
                <div className={`max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {category.description || 'Откройте для себя лучшее из нашей коллекции'}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {visibleProducts.map((product) => (
                  <CategoryProductCard 
                    key={product.id} 
                    product={product} 
                  />
                ))}
              </div>

              {/* View More Button */}
              {hasMore && (
                <div className="flex justify-center mt-16">
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand(category.id)}
                    className={`group flex items-center gap-3 px-10 py-4 rounded-full text-base font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 hover:border-amber-500/50' 
                        : 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-white hover:shadow-xl hover:border-amber-600/50'
                    }`}
                  >
                    <span>{expanded ? 'Свернуть коллекцию' : 'Показать всю категорию'}</span>
                    <div className="transition-transform duration-300 group-hover:scale-125">
                      {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default WebsiteCategoriesPreview;
