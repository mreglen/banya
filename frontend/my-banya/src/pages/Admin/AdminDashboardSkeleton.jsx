// src/pages/Admin/AdminDashboardSkeleton.jsx
import Skeleton from '../../components/UI/Skeleton/Skeleton';

function AdminDashboardSkeleton() {
  return (
    <div className="p-4 sm:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton.TitleLg width="300px" className="mb-2" />
          <Skeleton.Text width="200px" />
        </div>
        <Skeleton.Button width="140px" height="44px" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <Skeleton.Circle size="48px" className="mb-4" />
            <Skeleton.Text width="100px" className="mb-2" />
            <Skeleton.Title width="120px" />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <Skeleton.Title width="200px" className="mb-8" />
          <div className="h-[350px] w-full bg-gray-50 rounded-2xl animate-pulse"></div>
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <Skeleton.Title width="150px" className="mb-8" />
          <div className="h-[350px] w-full bg-gray-50 rounded-2xl animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <Skeleton.Title width="180px" className="mb-8" />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Skeleton.Circle size="200px" />
            <div className="flex-1 space-y-4 w-full">
              {[1, 2, 3, 4].map(i => <Skeleton.Text key={i} width="100%" />)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <Skeleton.Title width="220px" className="mb-8" />
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton.Circle size="40px" />
                <div className="flex-1">
                  <Skeleton.Text width="80%" className="mb-2" />
                  <Skeleton.Text width="40%" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardSkeleton;
