
import CategoriesManager from './AdminCategories';
import ItemsManager from './AdminMenuItem';

export default function AdminMenu() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Кухня бани</h1>
          <p className="text-gray-600 mt-2">Управление категориями и товарами меню</p>
        </div>

        {/* Менеджер категорий */}
        <CategoriesManager />

        {/* Менеджер товаров */}
        <ItemsManager />
      </div>
    </div>
  );
}