// src/pages/Admin/Documents/DocumentsEntrance/DocumentsEntranceSkeleton.jsx
import Skeleton from '../../../../components/UI/Skeleton/Skeleton';

function DocumentsEntranceSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и кнопка */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <Skeleton.Title width="250px" />
          <Skeleton.Button width="180px" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Дата', 'Поставщик', 'Сумма', 'Ответственный', 'Действия'].map((_, i) => (
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
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Skeleton.Title width="100px" className="mb-1" />
                  <Skeleton.Text width="80px" />
                </div>
                <Skeleton.Title width="80px" />
              </div>
              <Skeleton.Text width="90%" className="mb-2" />
              <Skeleton.Text width="70%" className="mb-3" />
              <div className="flex justify-end space-x-2">
                <Skeleton.Button width="100px" />
                <Skeleton.Button width="80px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentsEntranceSkeleton;
