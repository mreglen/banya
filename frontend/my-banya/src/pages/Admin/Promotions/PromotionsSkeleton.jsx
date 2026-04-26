// src/pages/Admin/Promotions/PromotionsSkeleton.jsx
import Skeleton from '../../../components/UI/Skeleton/Skeleton';

function PromotionsSkeleton() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton.Title width="180px" />
        <Skeleton.Button width="160px" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-3">
              <Skeleton.Title width="200px" />
              <Skeleton.Text width="60px" />
            </div>
            <Skeleton.Text width="90%" className="mb-2" />
            <Skeleton.Text width="70%" className="mb-4" />
            <div className="flex gap-3">
              <Skeleton.Button width="100px" />
              <Skeleton.Button width="90px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PromotionsSkeleton;
