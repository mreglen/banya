import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CustomButton from '../../../components/UI/CustomButton/CustomButton';
import { useGetBathByIdQuery } from '../../../redux/slices/apiSlice';
import { useState, useEffect } from 'react';

function BathsCard() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: bath, isLoading, error } = useGetBathByIdQuery(slug);

  const mainIndex = parseInt(searchParams.get('main')) || 0;


  useEffect(() => {
    if (bath?.photos) {
      // Для фото используем базовый URL сервера (без /api)
      const baseUrl = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');
      const fullUrls = bath.photos.map(p => {
        const url = p.image_url;
        return url.startsWith('/')
          ? `${baseUrl}${url}`
          : `${baseUrl}/${url}`;
      });

      setImages(fullUrls);
      setCurrentImageIndex(mainIndex < fullUrls.length ? mainIndex : 0);
    }
  }, [bath, mainIndex]);

  const handleThumbnailClick = (thumbIndex) => {
    setCurrentImageIndex(thumbIndex + 1);
    setSearchParams({ main: thumbIndex + 1 });
  };

  const handlePreviousImage = () => {
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    setSearchParams({ main: newIndex });
  };

  const handleNextImage = () => {
    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    setSearchParams({ main: newIndex });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center mt-16">
        <h2 className="text-3xl font-light text-gray-800">Загрузка бани...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center mt-16">
        <h2 className="text-3xl font-light text-gray-800">Ошибка загрузки</h2>
        <p className="text-gray-600 mt-2">Не удалось загрузить баню. Попробуйте позже.</p>
        <div className="mt-6">
          <CustomButton to="/baths" text="Все бани" variant="green" />
        </div>
      </div>
    );
  }

  if (!bath) {
    return (
      <div className="py-20 text-center mt-16">
        <h2 className="text-3xl font-light text-gray-800">Баня не найдена</h2>
        <p className="text-gray-600 mt-2">Проверьте адрес или вернитесь на главную.</p>
        <div className="mt-6">
          <CustomButton to="/baths" text="Все бани" variant="green" />
        </div>
      </div>
    );
  };
  
  return (
    <section className="py-12 px-6 bg-white min-h-screen mt-28">
      <Helmet>
        <title>{bath.name} - Николаевские бани в Екатеринбурге</title>
        <meta name="description" content={bath.description || `${bath.name} - ${bath.subtitle}. Русская баня на дровах в Екатеринбурге.`} />
        <meta name="keywords" content={`${bath.name}, баня ${bath.name}, русская баня, баня на дровах, Николаевские бани`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${bath.name} - Николаевские бани`} />
        <meta property="og:description" content={bath.description?.slice(0, 200) || bath.subtitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://nikolaevskie-bani.ru/baths/${bath.slug || slug}`} />
        {images[0] && <meta property="og:image" content={images[0]} />}
        <meta property="og:locale" content="ru_RU" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${bath.name} - Николаевские бани`} />
        <meta name="twitter:description" content={bath.description?.slice(0, 200) || bath.subtitle} />
        {images[0] && <meta name="twitter:image" content={images[0]} />}
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": bath.name,
            "description": bath.description,
            "url": `https://nikolaevskie-bani.ru/baths/${bath.slug || slug}`,
            "image": images[0] || '',
            "touristType": "Отдых и оздоровление"
          })}
        </script>
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-800">{bath.name}</h1>
          <p className="text-xl text-green-600 font-medium mt-2">{bath.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                src={images[currentImageIndex]}
                alt={bath.name}
                className="w-full h-64 sm:h-80 object-cover"
              />
              
              {/* Навигационные стрелки поверх фото */}
              {images.length > 1 && (
                <>
                  {/* Стрелка влево */}
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
                    aria-label="Предыдущее фото"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Стрелка вправо */}
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm z-10"
                    aria-label="Следующее фото"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`rounded-lg overflow-hidden shadow-md cursor-pointer ${
                    index === currentImageIndex ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img
                    src={img}
                    alt={`${bath.name} — деталь ${index + 1}`}
                    className="w-full h-24 object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-gray-50 p-8 rounded-2xl shadow-md">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg font-extralight">
                {bath.description}
              </p>

              <div className="pt-4">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Характеристики:</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Цена с пн-чт:</span>
                    <span className="font-medium">{bath.cost_weekday} ₽/час</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Цена с пт-вс:</span>
                    <span className="font-medium">{bath.cost_weekend} ₽/час</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Базовое кол-во гостей:</span>
                    <span className="font-medium">{bath.base_guests}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Цена за доп. гостя:</span>
                    <span className="font-medium">{bath.extra_guest_price} ₽</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <CustomButton
                  to="/booking"
                  text="Забронировать эту баню"
                  variant="green"
                  className="py-3 text-base flex-1 text-center"
                />
                <CustomButton
                  to="/baths"
                  text="Все бани"
                  className="py-3 text-base flex-1 text-center border border-gray-300 text-gray-700 hover:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Акции для этой бани */}
        {bath.promotions && bath.promotions.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <h2 className="text-3xl font-light text-gray-800 mb-10 text-center">Специальные предложения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {bath.promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors duration-300"
                >
                  <h3 className="text-xl font-light text-gray-800 mb-3">{promo.name}</h3>
                  
                  {promo.description && (
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed font-extralight">{promo.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {promo.min_hours && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>При заказе от <strong className="font-medium">{promo.min_hours} ч</strong></span>
                      </div>
                    )}
                    {promo.min_guests && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>При заказе от <strong className="font-medium">{promo.min_guests} чел</strong></span>
                      </div>
                    )}
                    {promo.bonus_minutes && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span><strong className="font-medium text-green-600">+{promo.bonus_minutes} мин</strong> дополнительно</span>
                      </div>
                    )}
                    {promo.gift_products && promo.gift_products.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-gray-100">
                        <div className="text-gray-600 text-sm mb-2">Подарки:</div>
                        <ul className="space-y-1">
                          {promo.gift_products.map((gp, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{gp.product_name} <span className="text-gray-500">× {gp.quantity}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {(promo.valid_from || promo.valid_until) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 font-extralight">
                      {promo.valid_from && promo.valid_until ? (
                        <span>Период: {new Date(promo.valid_from).toLocaleDateString('ru-RU')} — {new Date(promo.valid_until).toLocaleDateString('ru-RU')}</span>
                      ) : promo.valid_from ? (
                        <span>Действует с {new Date(promo.valid_from).toLocaleDateString('ru-RU')}</span>
                      ) : (
                        <span>Действует до {new Date(promo.valid_until).toLocaleDateString('ru-RU')}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default BathsCard;