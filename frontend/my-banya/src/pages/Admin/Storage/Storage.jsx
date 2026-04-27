// src/pages/Admin/Storage/Storage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryTree from './CategoryTree';
import ProductList from './ProductList';
import StorageSkeleton from './StorageSkeleton';
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useCreateProductMutation,
} from '../../../redux/slices/productsApiSlice';

function Storage() {
  const navigate = useNavigate();

  const {
    data: categoriesTree = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useGetProductsQuery();

  const [createProduct] = useCreateProductMutation();

  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState(null); // 'min_stock' или null

  const handleEdit = (productId) => {
    navigate(`/admin/storage/product/${productId}`);
  };

  const toggleCategory = (id) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectCategory = (path) => setSelectedCategoryPath(path);

  const handleAddProduct = async (productData) => {
    try {
      await createProduct({
        name: productData.name,
        description: productData.description,
        category_id: productData.categoryPath.id,
      }).unwrap();
      refetchProducts();
      refetchCategories();
    } catch (err) {
      console.error('Ошибка создания товара:', err);
      alert('Не удалось создать товар');
    }
  };

  useEffect(() => {
    const handleAddProductFromState = () => {
      const state = window.history.state?.usr;
      if (state?.newProduct) {
        handleAddProduct(state.newProduct);
        window.history.replaceState({}, '');
      }
    };
    handleAddProductFromState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingCategories || isLoadingProducts) {
    return <StorageSkeleton />;
  }

  if (isCategoriesError || isProductsError) {
    return <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">Ошибка загрузки данных</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Склад</h1>
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-sm"
            >
              Фильтр {filterType === 'min_stock' && '✓'}
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setFilterType(filterType === 'min_stock' ? null : 'min_stock');
                    setShowFilter(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  {filterType === 'min_stock' ? '✓ ' : ''}Минимальный остаток
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Адаптив: на мобильных — один под другим */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="w-full lg:w-1/4">
            <CategoryTree
              categoriesTree={categoriesTree}
              expandedCategories={expandedCategories}
              selectedCategoryPath={selectedCategoryPath}
              toggleCategory={toggleCategory}
              selectCategory={selectCategory}
              onCategoriesChange={refetchCategories}
            />
          </div>
          <div className="w-full lg:w-3/4">
            <ProductList
              selectedCategoryPath={selectedCategoryPath}
              categoriesTree={categoriesTree}
              storageData={products}
              handleEdit={handleEdit}
              filterType={filterType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Storage;