import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import CustomButton from '../../../../components/UI/CustomButton/CustomButton';
import { useGetBathsQuery } from '../../../../redux/slices/apiSlice';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function SliderBaths() {

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
    <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gray-900">
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
        className="h-80 sm:h-96 md:h-[520px] lg:h-[600px] rounded-3xl"
      >
        {baths.map((bath) => (
          <SwiperSlide key={bath.id}>
            <div className="relative flex flex-col md:flex-row items-center justify-center h-full text-white">

           
              <div
                className="absolute inset-0 md:relative md:w-1/2 h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${bath.image})` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40 md:bg-opacity-20 transition duration-500 hover:bg-opacity-30"></div>
              </div>

         
              <div className="relative z-10 md:w-1/2 w-full px-6 md:px-12 py-16 md:py-0 text-center md:text-left">
                <div className="space-y-6 max-w-lg mx-auto md:mx-0">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white drop-shadow-md">
                    {bath.name}
                  </h1>
                  <p className="text-lg sm:text-xl font-extralight text-gray-200 leading-relaxed">
                    {bath.subtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-8">
                    <CustomButton
                      to={`/baths/${bath.id}`}
                      text="Подробнее"
                      className="px-6 py-3"
                    />
                    <CustomButton
                      to="/baths"
                      variant="green"
                      text="Все бани"
                      className="px-6 py-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default SliderBaths;