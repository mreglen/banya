// src/pages/Admin/AdminDashboardSkeleton.jsx
import Skeleton from '../../components/UI/Skeleton/Skeleton';

function AdminDashboardSkeleton() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton.TitleLg width="250px" className="mb-2" />
        <Skeleton.Text width="400px" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <Skeleton.Circle size="48px" />
            </div>
            <Skeleton.Title width="80px" className="mb-2" />
            <Skeleton.Text width="120px" />
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="mb-8">
        <Skeleton.Title width="200px" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-start gap-4">
                <Skeleton.Circle size="48px" />
                <div className="flex-1">
                  <Skeleton.Title width="70%" className="mb-2" />
                  <Skeleton.Text width="90%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow">
        <Skeleton.Title width="220px" className="mb-4" />
        <div className="text-center py-8">
          <Skeleton.Circle size="64px" className="mx-auto mb-4" />
          <Skeleton.Text width="300px" className="mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardSkeleton;
