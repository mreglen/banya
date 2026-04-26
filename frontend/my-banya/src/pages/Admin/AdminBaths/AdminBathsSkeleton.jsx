// src/pages/Admin/AdminBaths/AdminBathsSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function AdminBathsSkeleton() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton.Title width="150px" />
        <Skeleton.Button width="150px" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Image placeholder */}
            <div className="h-48 bg-gray-200 animate-pulse" />
            
            <div className="p-6">
              <Skeleton.Title width="70%" className="mb-2" />
              <Skeleton.Text width="90%" className="mb-2" />
              <Skeleton.Text width="60%" className="mb-4" />
              <div className="flex gap-2">
                <Skeleton.Button width="45%" />
                <Skeleton.Button width="45%" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBathsSkeleton;
