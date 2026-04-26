// src/pages/Kitchen/Kitchen.jsx
import { useState, useEffect } from 'react';

// Статические данные
const staticCategories = [
  { id: 1, slug: 'hot-dishes', label: 'Горячие блюда' },
  { id: 2, slug: 'snacks', label: 'Закуски' },
  { id: 3, slug: 'drinks', label: 'Напитки' },
  { id: 4, slug: 'desserts', label: 'Десерты' },
];

const staticMenuItems = [
  {
    id: 1,
    name: 'Борщ',
    description: 'Наваристый борщ с говядиной и сметаной',
    price: 350,
    category: 'hot-dishes',
  },
  {
    id: 2,
    name: 'Пельмени',
    description: 'Домашние пельмени с мясом, подаются со сметаной',
    price: 420,
    category: 'hot-dishes',
  },
  {
    id: 3,
    name: 'Солёные огурцы',
    description: 'Хрустящие солёные огурчики с грядки',
    price: 180,
    category: 'snacks',
  },
  {
    id: 4,
    name: 'Квас',
    description: 'Натуральный квас собственного приготовления',
    price: 150,
    category: 'drinks',
  },
  {
    id: 5,
    name: 'Медовик',
    description: 'Классический медовик с нежным кремом',
    price: 280,
    category: 'desserts',
  },
  {
    id: 6,
    name: 'Квасное тесто с изюмом',
    description: 'Сладкая булочка по бабушкиному рецепту',
    price: 220,
    category: 'desserts',
  },
];

function Kitchen() {
  const [activeTab, setActiveTab] = useState(null);

  // Устанавливаем первую категорию как активную
  useEffect(() => {
    if (staticCategories.length > 0 && !activeTab) {
      setActiveTab(staticCategories[0].slug);
    }
  }, [activeTab]);

  // Фильтруем товары по активной категории
  const currentItems = staticMenuItems.filter(
    (item) => item.category === activeTab
  );

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
          {staticCategories.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => setActiveTab(tab.slug)}
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