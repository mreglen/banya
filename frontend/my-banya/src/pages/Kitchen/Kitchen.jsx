// src/pages/Kitchen/Kitchen.jsx
import { useState, useEffect } from 'react';
import {
  useGetAllMenuItemsQuery,
  useGetMenuCategoriesQuery,
} from '../../redux/slices/apiSlice';

function Kitchen() {
  const { data: categories = [], isLoading: loadingCategories } = useGetMenuCategoriesQuery();
  const { data: allItems, isLoading: loadingItems, error } = useGetAllMenuItemsQuery();

  const [activeTab, setActiveTab] = useState(null);

  // Устанавливаем первую категорию как активную
  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].slug); // 👈 ИСПОЛЬЗУЕМ slug, а не id!
    }
  }, [categories, activeTab]);

  // Фильтруем товары по активной категории
  const currentItems = allItems?.filter(
    (item) => item.category === activeTab // 👈 Сравниваем с slug
  ) || [];

  if (loadingCategories || loadingItems) {
    return (
      <section className="py-16 px-6 bg-gradient-to-b from-white to-amber-50 min-h-screen mt-28">
        <div className="text-center text-gray-600">Загрузка меню...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-6 bg-gradient-to-b from-white to-amber-50 min-h-screen mt-28">
        <div className="text-center text-red-500">Ошибка: {error.toString()}</div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <section className="py-16 px-6 bg-gradient-to-b from-white to-amber-50 min-h-screen mt-28">
        <div className="text-center text-red-500">Категории не найдены. Добавьте первую через админку.</div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-white to-amber-50 min-h-screen mt-28">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">Кухня бани</h1>
        <p className="text-lg text-gray-600 font-extralight">
          После парилки — вкусно и тепло. Подберите идеальное сочетание для полного расслабления.
        </p>
      </div>

      {/* ВКЛАДКИ — ПО SLUG */}
      <div className="max-w-5xl mx-auto mb-14 flex justify-center">
        <div className="flex bg-transparent rounded-full p-1 shadow-sm">
          {categories.map((tab) => (
            <button
              key={tab.slug} // 👈 Используем slug как ключ
              onClick={() => setActiveTab(tab.slug)} // 👈 Передаём slug
              className={`px-7 py-3 rounded-full text-sm font-medium transition-all duration-300 focus:outline-none ${
                activeTab === tab.slug
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ТОВАРЫ */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="h-1 bg-green-300"></div>

              <div className="p-6 flex-1 flex flex-col items-center text-center">
                <h3 className="text-xl font-medium text-gray-800 mb-1">{item.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {item.description}
                </p>

                <div className="mt-auto pt-4">
                  <p className="text-2xl font-bold text-gray-800">{item.price} ₽</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center text-gray-500 py-16">
            Товары не найдены
          </div>
        )}
      </div>
    </section>
  );
}

export default Kitchen;