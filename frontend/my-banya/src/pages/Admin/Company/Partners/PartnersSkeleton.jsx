// src/pages/Admin/Company/Partners/PartnersSkeleton.jsx
import Skeleton from '../../../../components/UI/Skeleton/Skeleton';

function PartnersSkeleton() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton.Title width="180px" />
        <Skeleton.Button width="140px" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Поставщик', 'Контакты', 'Действия'].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <Skeleton.Text width="80px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td className="px-6 py-4"><Skeleton.Text width="140px" /></td>
                <td className="px-6 py-4"><Skeleton.Text width="110px" /></td>
                <td className="px-6 py-4"><Skeleton.Button width="80px" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4">
            <Skeleton.Title width="120px" className="mb-2" />
            <Skeleton.Text width="90%" className="mb-3" />
            <div className="flex justify-end">
              <Skeleton.Button width="80px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PartnersSkeleton;
