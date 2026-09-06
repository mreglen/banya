// src/pages/Admin/Documents/DocumentsEntrance/ProductSelectionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  useGetCategoriesQuery,
  useGetStockProductsQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useGetUnitsOfMeasurementQuery,
} from '../../../../redux/slices/productsApiSlice';

const ROOT_LABEL = 'Все товары';

const ChevronIcon = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const findCategoryById = (cats, id) => {
  for (const cat of cats || []) {
    if (cat.id === id) return cat;
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, id);
      if (found) return found;
    }
  }
  return null;
};

const collectAncestorIds = (cats, targetId, path = []) => {
  for (const cat of cats || []) {
    const next = [...path, cat.id];
    if (cat.id === targetId) return next;
    if (cat.children?.length) {
      const found = collectAncestorIds(cat.children, targetId, next);
      if (found) return found;
    }
  }
  return null;
};

const ProductSelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  initialCategory = null,
  startInCreate = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createParentId, setCreateParentId] = useState(null);
  const [expandedParentCategories, setExpandedParentCategories] = useState(new Set());

  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductUnitId, setNewProductUnitId] = useState('');
  const [productCategoryId, setProductCategoryId] = useState(null);
  const [expandedProductParentCategories, setExpandedProductParentCategories] = useState(new Set());

  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: products = [], isLoading: isLoadingProducts } = useGetStockProductsQuery();
  const { data: units = [] } = useGetUnitsOfMeasurementQuery();
  const [createCategory, { isLoading: isCreatingCat }] = useCreateCategoryMutation();
  const [createProduct, { isLoading: isCreatingProd }] = useCreateProductMutation();

  const resetModalState = useCallback(() => {
    setSelectedCategory(null);
    setExpandedCategories(new Set());
    setProductSearchTerm('');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setCreateParentId(null);
    setExpandedParentCategories(new Set());
    setIsCreatingProduct(false);
    setNewProductName('');
    setNewProductDescription('');
    setNewProductCost('');
    setNewProductUnitId('');
    setProductCategoryId(null);
    setExpandedProductParentCategories(new Set());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetModalState();

    const initialId = initialCategory?.id ?? null;
    if (initialId) {
      setSelectedCategory(initialCategory);
      setExpandedCategories(new Set([initialId]));
    }

    if (startInCreate) {
      setProductCategoryId(initialId);
      setNewProductName('');
      setNewProductDescription('');
      setNewProductCost('');
      setNewProductUnitId('');
      setExpandedProductParentCategories(initialId ? new Set([initialId]) : new Set());
      setIsCreatingProduct(true);
    }
  }, [isOpen, initialCategory, startInCreate, resetModalState]);

  useEffect(() => {
    if (!isOpen || !categories.length) return;
    const expandFor = (id, setter) => {
      if (id == null) return;
      const ancestors = collectAncestorIds(categories, id);
      if (ancestors?.length) setter(new Set(ancestors));
    };
    if (selectedCategory?.id) expandFor(selectedCategory.id, setExpandedCategories);
    if (createParentId != null) expandFor(createParentId, setExpandedParentCategories);
    if (productCategoryId != null) expandFor(productCategoryId, setExpandedProductParentCategories);
  }, [isOpen, categories, selectedCategory?.id, createParentId, productCategoryId]);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  const findUnitName = (unitId) => {
    if (!unitId) return 'шт.';
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : 'шт.';
  };

  const getProductStock = (product) => {
    const stock = Number(product?.total_quantity);
    return Number.isFinite(stock) ? stock : 0;
  };

  const getProductPrice = (product) => {
    const price = Number(product?.price ?? product?.last_purchase_price);
    return Number.isFinite(price) ? price : 0;
  };

  const filteredProducts = React.useMemo(() => {
    const searchValue = productSearchTerm.trim().toLowerCase();
    const matchesSearch = (product) => {
      if (!searchValue) return true;
      return product.name.toLowerCase().includes(searchValue);
    };

    if (!selectedCategory) return products.filter(matchesSearch);

    const collectSubcategoryIds = (category) => {
      let ids = [category.id];
      if (category.children?.length) {
        for (const child of category.children) {
          ids = [...ids, ...collectSubcategoryIds(child)];
        }
      }
      return ids;
    };

    const allCategoryIds = collectSubcategoryIds(selectedCategory);
    return products.filter(
      (product) => allCategoryIds.includes(product.category_id) && matchesSearch(product)
    );
  }, [selectedCategory, products, productSearchTerm]);

  const toggleExpand = (id, setter) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCategory = (category) => {
    setSelectedCategory(category);
    if (category.children?.length && !expandedCategories.has(category.id)) {
      setExpandedCategories((prev) => new Set([...prev, category.id]));
    }
  };

  const openCreateCategoryModal = (parentId = null) => {
    const resolvedParentId = parentId !== undefined ? parentId : selectedCategory?.id ?? null;
    setCreateParentId(resolvedParentId);
    setNewCategoryName('');
    const ancestors =
      resolvedParentId != null
        ? collectAncestorIds(categories, resolvedParentId) || [resolvedParentId]
        : [];
    setExpandedParentCategories(new Set(ancestors));
    setIsCreatingCategory(true);
  };

  const openCreateProductModal = (categoryId = undefined) => {
    const resolvedId = categoryId !== undefined ? categoryId : selectedCategory?.id ?? null;
    setProductCategoryId(resolvedId);
    setNewProductName('');
    setNewProductDescription('');
    setNewProductCost('');
    setNewProductUnitId(units[0]?.id ? String(units[0].id) : '');
    const ancestors =
      resolvedId != null ? collectAncestorIds(categories, resolvedId) || [resolvedId] : [];
    setExpandedProductParentCategories(new Set(ancestors));
    setIsCreatingProduct(true);
  };

  const parentCategoryName = (parentId) => {
    if (parentId == null) return ROOT_LABEL;
    return findCategoryById(categories, parentId)?.name || ROOT_LABEL;
  };

  const renderCompactTree = ({
    categoryList,
    depth = 0,
    expandedSet,
    onToggleExpand,
    selectedId,
    onSelect,
    mode = 'select', // select | radio
    radioName = 'category',
  }) => {
    return categoryList.map((category) => {
      const hasChildren = category.children?.length > 0;
      const isExpanded = expandedSet.has(category.id);
      const isSelected = selectedId === category.id;

      return (
        <div key={category.id}>
          <div
            className={`flex items-center gap-0.5 rounded-lg min-h-[36px] pr-1 transition-colors ${
              isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${6 + depth * 10}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(category.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md shrink-0 text-gray-600"
                aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
              >
                <ChevronIcon open={isExpanded} />
              </button>
            ) : (
              <span className="w-7 h-7 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              </span>
            )}

            {mode === 'radio' ? (
              <label className="flex-1 min-w-0 flex items-center gap-2 py-1.5 pr-1 cursor-pointer">
                <input
                  type="radio"
                  name={radioName}
                  checked={isSelected}
                  onChange={() => onSelect(category)}
                  className="shrink-0"
                />
                <span
                  className={`truncate text-sm ${
                    isSelected ? 'text-blue-800 font-semibold' : 'text-gray-800 font-medium'
                  }`}
                >
                  {category.name}
                </span>
              </label>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(category)}
                className="flex-1 min-w-0 text-left py-1.5 pr-1"
              >
                <span
                  className={`block truncate text-sm ${
                    isSelected ? 'text-blue-800 font-semibold' : 'text-gray-800 font-medium'
                  }`}
                >
                  {category.name}
                </span>
              </button>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div>
              {renderCompactTree({
                categoryList: category.children,
                depth: depth + 1,
                expandedSet,
                onToggleExpand,
                selectedId,
                onSelect,
                mode,
                radioName,
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Имя категории не может быть пустым');
      return;
    }

    try {
      const created = await createCategory({
        name: newCategoryName.trim(),
        parent_id: createParentId,
      }).unwrap();

      if (createParentId != null) {
        setExpandedCategories((prev) => new Set([...prev, createParentId]));
      }

      setSelectedCategory(created);
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (err) {
      console.error('Ошибка создания категории:', err);
      alert('Не удалось создать категорию');
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      alert('Название товара обязательно');
      return;
    }

    let costNum = 0;
    if (newProductCost.trim() !== '') {
      costNum = parseFloat(newProductCost.replace(',', '.'));
      if (Number.isNaN(costNum) || costNum < 0) {
        alert('Укажите корректную цену закупки');
        return;
      }
    }

    try {
      const payload = {
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        category_id: productCategoryId,
      };
      if (newProductUnitId) {
        payload.unit_id = Number(newProductUnitId);
      }
      if (costNum > 0) {
        payload.price = costNum;
      }

      const newProduct = await createProduct(payload).unwrap();
      onSelect(newProduct);
      resetModalState();
      onClose();
    } catch (err) {
      console.error('Ошибка создания товара:', err);
      alert('Не удалось создать товар');
    }
  };

  const handleSelectExistingProduct = (product) => {
    onSelect(product);
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-3">
      <div className="bg-white w-full sm:max-w-5xl sm:rounded-2xl shadow-xl h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Выберите категорию и товар</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Категория:{' '}
              <span className="font-medium text-gray-800">
                {selectedCategory?.name || ROOT_LABEL}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openCreateCategoryModal(selectedCategory?.id ?? null)}
              className="px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100"
            >
              Добавить категорию
            </button>
            <button
              type="button"
              onClick={() => openCreateProductModal()}
              className="px-3 py-2 bg-green-50 text-green-800 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100"
            >
              Добавить товар
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
          {/* Компактное дерево категорий */}
          <aside className="sm:w-56 lg:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-100 flex flex-col max-h-[36vh] sm:max-h-none">
            <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Категории
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-2 space-y-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-2 min-h-[36px] px-2 rounded-lg text-left ${
                  !selectedCategory
                    ? 'bg-blue-50 ring-1 ring-blue-200 text-blue-800'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    !selectedCategory ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
                <span className={`truncate text-sm ${!selectedCategory ? 'font-semibold' : 'font-medium'}`}>
                  {ROOT_LABEL}
                </span>
              </button>

              {isLoadingCategories ? (
                <p className="text-sm text-gray-500 px-2 py-3">Загрузка...</p>
              ) : (
                renderCompactTree({
                  categoryList: categories,
                  expandedSet: expandedCategories,
                  onToggleExpand: (id) => toggleExpand(id, setExpandedCategories),
                  selectedId: selectedCategory?.id ?? null,
                  onSelect: openCategory,
                  mode: 'select',
                })
              )}
            </div>
          </aside>

          {/* Список товаров */}
          <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-4 py-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Товары {selectedCategory ? `в «${selectedCategory.name}»` : 'во всех категориях'}
            </div>
            <input
              type="search"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="w-full px-3 py-2.5 mb-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 [&::-webkit-search-cancel-button]:hidden"
              placeholder="Поиск товара..."
            />

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {isLoadingProducts ? (
                <p className="text-sm text-gray-500 py-4">Загрузка товаров...</p>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    {selectedCategory ? 'Нет товаров в этой категории' : 'Нет товаров'}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateProductModal()}
                    className="px-4 py-2.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-sm font-medium"
                  >
                    + Добавить товар
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 sm:hidden">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectExistingProduct(product)}
                        className="w-full text-left p-3 border border-gray-200 rounded-xl bg-white active:bg-gray-50"
                      >
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.description || '—'}
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-gray-600">
                            {getProductStock(product)} {findUnitName(product.unit_id)}
                          </span>
                          <span className="font-semibold text-green-800">
                            {getProductPrice(product).toFixed(2)} ₽
                          </span>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => openCreateProductModal()}
                      className="w-full p-3 border border-dashed border-green-400 rounded-xl bg-green-50 text-green-700 font-medium text-sm"
                    >
                      + Добавить товар
                    </button>
                  </div>

                  <table className="hidden sm:table w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Название</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Описание</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Остаток</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Ед.</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-600">Цена</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-gray-600">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                          <td
                            className="px-2 py-2 text-xs text-gray-600 max-w-[140px] truncate"
                            title={product.description || ''}
                          >
                            {product.description || '—'}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-800">{getProductStock(product)}</td>
                          <td className="px-2 py-2 text-xs text-gray-700">{findUnitName(product.unit_id)}</td>
                          <td className="px-2 py-2 text-sm text-gray-800">
                            {getProductPrice(product).toFixed(2)} ₽
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectExistingProduct(product)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              Выбрать
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-green-50/60">
                        <td colSpan={6} className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => openCreateProductModal()}
                            className="text-sm font-medium text-green-700 hover:text-green-900"
                          >
                            + Добавить товар
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="shrink-0 pt-3 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка создания категории */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900">Добавить категорию</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                Родитель: {parentCategoryName(createParentId)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Куда добавить
                </label>
                <div className="border border-gray-200 rounded-xl p-2 max-h-52 overflow-y-auto bg-gray-50">
                  <label
                    className={`flex items-center gap-2 min-h-[36px] px-2 rounded-lg cursor-pointer ${
                      createParentId === null ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="parent-category"
                      checked={createParentId === null}
                      onChange={() => setCreateParentId(null)}
                    />
                    <span className="text-sm font-medium">{ROOT_LABEL}</span>
                  </label>
                  {isLoadingCategories ? (
                    <p className="text-gray-500 px-2 py-2 text-sm">Загрузка...</p>
                  ) : (
                    renderCompactTree({
                      categoryList: categories,
                      expandedSet: expandedParentCategories,
                      onToggleExpand: (id) => toggleExpand(id, setExpandedParentCategories),
                      selectedId: createParentId,
                      onSelect: (cat) => setCreateParentId(cat.id),
                      mode: 'radio',
                      radioName: 'parent-category',
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя категории
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Введите имя категории"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                  }}
                />
              </div>
            </div>

            <div className="shrink-0 p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false);
                  setNewCategoryName('');
                }}
                className="min-h-[44px] px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCreatingCat}
                className="min-h-[44px] px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {isCreatingCat ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления товара (как при оприходовании) */}
      {isCreatingProduct && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 text-lg">Добавление товара</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                Новый товар будет сразу доступен для выбора
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                <div className="border border-gray-200 rounded-xl p-2 max-h-44 overflow-y-auto bg-gray-50">
                  <label
                    className={`flex items-center gap-2 min-h-[36px] px-2 rounded-lg cursor-pointer ${
                      productCategoryId === null ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="product-category"
                      checked={productCategoryId === null}
                      onChange={() => setProductCategoryId(null)}
                    />
                    <span className="text-sm font-medium">{ROOT_LABEL}</span>
                  </label>
                  {renderCompactTree({
                    categoryList: categories,
                    expandedSet: expandedProductParentCategories,
                    onToggleExpand: (id) => toggleExpand(id, setExpandedProductParentCategories),
                    selectedId: productCategoryId,
                    onSelect: (cat) => setProductCategoryId(cat.id),
                    mode: 'radio',
                    radioName: 'product-category',
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название товара *
                </label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Введите название"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Введите описание"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения
                  </label>
                  <select
                    value={newProductUnitId}
                    onChange={(e) => setNewProductUnitId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Не выбрана</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена закупки
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newProductCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(',', '.');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setNewProductCost(value);
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingProduct(false)}
                className="min-h-[48px] px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                disabled={isCreatingProd}
                className="min-h-[48px] px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {isCreatingProd ? 'Создание...' : 'Создать товар'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelectionModal;
