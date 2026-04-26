// src/pages/Admin/Documents/DocumentsRealization/DocumentsRealizationSkeleton.jsx
import Skeleton from '../../../../components/UI/Skeleton/Skeleton';

function DocumentsRealizationSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6 md:mb-8">
          <Skeleton.Title width="300px" className="mb-2" />
          <Skeleton.Text width="400px" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['№', 'ФИО клиента', 'Дата', 'Цена', 'Статус', 'Действия'].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <Skeleton.Text width="80px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="px-6 py-4">
                      <Skeleton.Text width="85%" />
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <Skeleton.Button width="80px" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4">
              <Skeleton.Title width="80px" className="mb-2" />
              <Skeleton.Text width="90%" className="mb-2" />
              <Skeleton.Text width="60%" className="mb-2" />
              <Skeleton.Text width="70%" className="mb-3" />
              <Skeleton.Button width="100%" className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentsRealizationSkeleton;
