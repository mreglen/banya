// src/pages/Admin/Company/Staffs/UsersSkeleton.jsx
import Skeleton from '../../../../components/UI/Skeleton/Skeleton';

function UsersSkeleton() {
  return (
    <div className="p-6">
      {/* Заголовок и кнопка */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton.Title width="200px" />
        <Skeleton.Button width="140px" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Сотрудник', 'Роль', 'Статус', 'Действия'].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <Skeleton.Text width="80px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton.Avatar />
                    <div>
                      <Skeleton.Text width="130px" className="mb-1" />
                      <Skeleton.Text width="100px" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton.Text width="90px" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton.Text width="70px" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton.Button width="80px" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton.Avatar />
              <div>
                <Skeleton.Title width="120px" className="mb-1" />
                <Skeleton.Text width="80px" />
              </div>
            </div>
            <Skeleton.Text width="70px" className="mb-3" />
            <div className="flex justify-end">
              <Skeleton.Button width="80px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UsersSkeleton;
