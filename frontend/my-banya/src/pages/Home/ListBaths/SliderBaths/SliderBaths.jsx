import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CustomButton from '../../../../components/UI/CustomButton/CustomButton';
import { useGetBathsQuery } from '../../../../redux/slices/apiSlice';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function SliderBaths() {
  const SERVER_BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : (window.location.origin || 'http://127.0.0.1:8000');
  const { data: baths = [], isLoading, error } = useGetBathsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-3xl">
        <p className="text-xl text-gray-300">Загрузка бань...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-3xl p-10 text-center">
        <p className="text-2xl text-red-400 mb-4">Ошибка загрузки</p>
        <p className="text-gray-400">Не удалось получить данные о банях.</p>
      </div>
    );
  }

  if (!baths.length) {
    return (
      <div className="bg-gray-900 rounded-3xl p-10 text-center">
        <p className="text-xl text-gray-400">Пока нет доступных бань</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        loop
        speed={800}
        className="h-80 sm:h-96 md:h-[500px] lg:h-[600px] rounded-2xl"
      >
        {baths.map((bath, index) => {
          const imageUrl = bath.photos?.[0]
            ? `${SERVER_BASE_URL}${bath.photos[0].image_url}`
            : bath.image;

          return (
          <SwiperSlide key={bath.bath_id || bath.id}>
            <div className="relative flex flex-col md:flex-row items-center justify-center h-full">
              <img
                src={imageUrl}
                alt={bath.name}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent md:to-black/20" />
              <div className="relative z-10 md:w-1/2 w-full px-6 md:px-12 py-16 md:py-0">
                <div className="space-y-6 max-w-lg mx-auto md:mx-0 md:bg-black/30 md:backdrop-blur-sm md:p-8 md:rounded-2xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white drop-shadow-lg">
                    {bath.name}
                  </h1>
                  <p className="text-lg sm:text-xl font-extralight text-gray-100 leading-relaxed">
                    {bath.subtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-8">
                    <CustomButton
                      to={`/baths/${bath.slug}`}
                      text="Подробнее"
                      className="px-6 py-3 w-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default SliderBaths;