// src/pages/Admin/AdminBookings/AdminBookingsSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function AdminBookingsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <Skeleton.Title width="200px" className="mb-2" />
          <Skeleton.Text width="350px" />
        </div>

        {/* Карточки заявок */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <Skeleton.Avatar />
                    <div>
                      <Skeleton.Title width="150px" className="mb-1" />
                      <Skeleton.Text width="120px" />
                    </div>
                  </div>
                  <Skeleton.Text width="90%" className="mb-2" />
                  <Skeleton.Text width="60%" className="mb-2" />
                  <Skeleton.Text width="40%" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton.Button width="140px" />
                  <Skeleton.Button width="100px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminBookingsSkeleton;
