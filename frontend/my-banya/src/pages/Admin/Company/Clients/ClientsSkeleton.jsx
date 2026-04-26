// src/pages/Admin/Company/Clients/ClientsSkeleton.jsx
import Skeleton from '../../../../components/UI/Skeleton/Skeleton';

function ClientsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Skeleton.TitleLg width="180px" className="mb-2" />
          <Skeleton.Text width="250px" />
        </div>

        {/* Add Button */}
        <div className="mb-6 md:mb-8 flex justify-end">
          <Skeleton.Button width="180px" />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['ФИО', 'Телефон', 'Email', 'Дата рождения', 'Действия'].map((_, i) => (
                  <th key={i} className="px-6 py-4">
                    <Skeleton.Text width="100px" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <Skeleton.Text width="150px" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton.Text width="120px" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton.Text width="140px" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton.Text width="100px" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton.Button width="100px" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <Skeleton.Title width="140px" className="mb-3" />
              <div className="space-y-2 mb-4">
                <Skeleton.Text width="120px" />
                <Skeleton.Text width="150px" />
                <Skeleton.Text width="100px" />
              </div>
              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <Skeleton.Button width="50%" />
                <Skeleton.Button width="50%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientsSkeleton;
