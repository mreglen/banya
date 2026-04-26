// src/pages/Admin/Storage/StorageSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function StorageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-8xl mx-auto">
        {/* Заголовок и фильтр */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <Skeleton.Title width="200px" className="mb-4 sm:mb-0" />
          <Skeleton.Button width="100px" />
        </div>

        {/* Двухколоночный layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Левая колонка - Категории */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <Skeleton.Text width="60%" className="mb-4" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="py-2 pl-4">
                  <Skeleton.Text width="80%" />
                </div>
              ))}
            </div>
          </div>

          {/* Правая колонка - Список товаров */}
          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <Skeleton.Title width="40%" />
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Наименование', 'Категория', 'Описание', 'Остаток', 'Цена'].map((_, i) => (
                        <th key={i} className="px-4 py-3">
                          <Skeleton.Text width="80px" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i}>
                        {[1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton.Text width="90%" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-4 mb-3 bg-gray-50">
                    <Skeleton.Title width="70%" className="mb-2" />
                    <Skeleton.Text width="90%" className="mb-2" />
                    <Skeleton.Text width="60%" className="mb-2" />
                    <div className="flex justify-between mt-2">
                      <Skeleton.Text width="40%" />
                      <Skeleton.Text width="30%" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StorageSkeleton;
