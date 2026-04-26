// src/pages/Admin/Settings/SettingsSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function SettingsSkeleton() {
  return (
    <div className="p-6">
      <Skeleton.Title width="200px" className="mb-6" />

      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <Skeleton.Title width="150px" className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j}>
                  <Skeleton.Text width="100px" className="mb-2" />
                  <Skeleton.Text width="100%" className="h-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsSkeleton;
