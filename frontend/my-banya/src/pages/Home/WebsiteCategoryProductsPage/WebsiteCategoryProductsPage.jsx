import { Link, useParams } from 'react-router-dom';
import { useGetWebsiteCategoriesPreviewQuery } from '../../../redux/slices/apiSlice';

function WebsiteCategoryProductsPage() {
  const { categoryId } = useParams();
  const { data: categories = [] } = useGetWebsiteCategoriesPreviewQuery();

  const category = categories.find((item) => String(item.id) === String(categoryId));

  if (!category) {
    return (
      <section className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-light text-gray-900 mb-4">Категория не найдена</h1>
          <Link to="/" className="text-amber-600 hover:text-amber-700">
            Вернуться на главную
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3">{category.name}</h1>
          <p className="text-gray-600">Полный список товаров, отображаемых на сайте.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {category.products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              <h3 className="text-xl font-medium text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description || 'Без описания'}</p>
              <p className="text-lg font-semibold text-amber-600">
                {(product.price ?? 0).toFixed(2)} ₽
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WebsiteCategoryProductsPage;
