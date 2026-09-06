// src/pages/Admin/Storage/Storage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CategoryTree from './CategoryTree';
import ProductList from './ProductList';
import StorageSkeleton from './StorageSkeleton';
import ProductSelectionModal from '../Documents/DocumentsEntrance/ProductSelectionModal';
import {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useCreateProductMutation,
} from '../../../redux/slices/productsApiSlice';

const STORAGE_VIEW_KEY = 'banya:admin-storage-view';

const getScrollParent = () => {
  if (typeof document === 'undefined') return null;
  return document.querySelector('main') || null;
};

const getScrollY = () => {
  const parent = getScrollParent();
  if (parent && parent.scrollHeight > parent.clientHeight) {
    return parent.scrollTop;
  }
  return window.scrollY || 0;
};

const setScrollY = (y) => {
  const parent = getScrollParent();
  if (parent && parent.scrollHeight > parent.clientHeight) {
    parent.scrollTop = y;
    return;
  }
  window.scrollTo(0, y);
};

const readStorageView = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_VIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStorageView = (state) => {
  try {
    sessionStorage.setItem(STORAGE_VIEW_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

function Storage() {
  const navigate = useNavigate();
  const savedView = useRef(readStorageView()).current;
  const scrollRestoredRef = useRef(false);

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

  const [selectedCategoryPath, setSelectedCategoryPath] = useState(
    () => savedView?.selectedCategoryPath || []
  );
  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(savedView?.expandedCategories || [])
  );
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState(() => savedView?.filterType ?? null);
  const [searchQuery, setSearchQuery] = useState(() => savedView?.searchQuery || '');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalCategory, setProductModalCategory] = useState(null);

  const persistView = (overrides = {}) => {
    writeStorageView({
      selectedCategoryPath,
      expandedCategories: [...expandedCategories],
      filterType,
      searchQuery,
      scrollY: getScrollY(),
      ...overrides,
    });
  };

  useEffect(() => {
    persistView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryPath, expandedCategories, filterType, searchQuery]);

  useEffect(() => {
    if (isLoadingCategories || isLoadingProducts || scrollRestoredRef.current) return;
    const scrollY = savedView?.scrollY;
    if (typeof scrollY !== 'number' || scrollY <= 0) {
      scrollRestoredRef.current = true;
      return;
    }
    scrollRestoredRef.current = true;
    const restore = () => setScrollY(scrollY);
    requestAnimationFrame(() => {
      restore();
      setTimeout(restore, 50);
      setTimeout(restore, 200);
    });
  }, [isLoadingCategories, isLoadingProducts, products, categoriesTree, savedView]);

  const handleEdit = (productId) => {
    persistView({ scrollY: getScrollY() });
    navigate(`/admin/storage/product/${productId}`, {
      state: { from: '/admin/storage/nomenclature' },
    });
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectCategory = (path) => setSelectedCategoryPath(path);

  const openAddProductModal = (category = null) => {
    setProductModalCategory(category?.id ? category : null);
    setIsProductModalOpen(true);
  };

  const handleProductModalSelect = (product) => {
    setIsProductModalOpen(false);
    setProductModalCategory(null);
    refetchProducts();
    refetchCategories();
    if (product?.id) {
      toast.success(`Товар «${product.name}» добавлен`);
      persistView({ scrollY: getScrollY() });
      navigate(`/admin/storage/product/${product.id}`, {
        state: { from: '/admin/storage/nomenclature' },
      });
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Склад</h1>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:items-center">
            <div className="relative w-full sm:w-80">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
              {searchQuery.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 bg-gray-100 hover:text-gray-800 hover:bg-gray-200 active:bg-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-sm"
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
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start">
          <div className="w-full lg:w-1/4 lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)]">
            <CategoryTree
              categoriesTree={categoriesTree}
              expandedCategories={expandedCategories}
              selectedCategoryPath={selectedCategoryPath}
              toggleCategory={toggleCategory}
              selectCategory={selectCategory}
              onCategoriesChange={refetchCategories}
              onAddProduct={openAddProductModal}
            />
          </div>
          <div className="w-full lg:w-3/4 min-w-0">
            <ProductList
              selectedCategoryPath={selectedCategoryPath}
              categoriesTree={categoriesTree}
              storageData={products}
              handleEdit={handleEdit}
              filterType={filterType}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductModalCategory(null);
        }}
        onSelect={handleProductModalSelect}
        initialCategory={productModalCategory}
      />
    </div>
  );
}

export default Storage;
