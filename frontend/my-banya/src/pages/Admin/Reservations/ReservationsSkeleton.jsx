// src/pages/Admin/Reservations/ReservationsSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function ReservationsSkeleton() {
  return (
    <div className="p-2 md:p-4">
      {/* Заголовок */}
      <Skeleton.Title width="280px" className="mb-4 md:mb-6" />

      {/* Фильтры */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <Skeleton.Button width="150px" />
          <Skeleton.Button width="120px" />
          <Skeleton.Button width="140px" />
        </div>
      </div>

      {/* Табы бань */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[1, 2, 3].map((i) => (
          <Skeleton.Button key={i} width="120px" className="mr-2" />
        ))}
      </div>

      {/* Desktop View - Таблица */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div className="inline-flex space-x-6">
            {/* Time column skeleton */}
            <div className="flex-shrink-0 w-32 bg-white p-4 rounded-lg shadow-sm">
              <Skeleton.Text width="60px" className="mb-4" />
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton.Text key={i} width="80px" className="mb-3" />
              ))}
            </div>

            {/* Bath columns skeleton */}
            {[1, 2].map((bath) => (
              <div key={bath} className="flex-shrink-0 w-96 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <Skeleton.Title width="60%" />
                </div>
                <div className="p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <Skeleton.Text width="70%" className="mb-2" />
                      <Skeleton.Text width="50%" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View - Карточки */}
      <div className="md:hidden space-y-6">
        {[1, 2].map((bath) => (
          <div key={bath} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <Skeleton.Title width="50%" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                  <Skeleton.Title width="60%" className="mb-2" />
                  <Skeleton.Text width="80%" className="mb-2" />
                  <Skeleton.Text width="40%" className="mb-2" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton.Button width="33%" />
                    <Skeleton.Button width="33%" />
                    <Skeleton.Button width="33%" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReservationsSkeleton;
