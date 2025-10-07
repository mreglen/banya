import { useParams, useSearchParams } from 'react-router-dom';
import CustomButton from '../../../components/UI/CustomButton/CustomButton';
import { useGetBathByIdQuery } from '../../../redux/slices/apiSlice';
import { useState, useEffect } from 'react';

function BathsCard() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [images, setImages] = useState([]);

  const { data: bath, isLoading, error } = useGetBathByIdQuery(id);

  const mainIndex = parseInt(searchParams.get('main')) || 0;


  useEffect(() => {
    if (bath?.images) {
      const newImages = [...bath.images];
    
      if (mainIndex > 0 && mainIndex < newImages.length) {
        [newImages[0], newImages[mainIndex]] = [newImages[mainIndex], newImages[0]];
      }
      setImages(newImages);
    }
  }, [bath, mainIndex]);

  const handleThumbnailClick = (thumbIndex) => {
    const actualIndex = thumbIndex + 1; 
    const newImages = [...images];
    [newImages[0], newImages[actualIndex]] = [newImages[actualIndex], newImages[0]];
    setImages(newImages);
    setSearchParams({ main: actualIndex }); 
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
  }

  const thumbnails = images.slice(1);

  return (
    <section className="py-12 px-6 bg-white min-h-screen mt-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-800">{bath.name}</h1>
          <p className="text-xl text-green-600 font-medium mt-2">{bath.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={images[0]}
                alt={bath.name}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {thumbnails.map((img, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden shadow-md cursor-pointer"
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
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  {bath.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <strong>{feature.key}:</strong> {feature.value}
                    </li>
                  ))}
                </ul>
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
      </div>
    </section>
  );
}

export default BathsCard;