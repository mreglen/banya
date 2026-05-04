// src/pages/Admin/Documents/DocumentsEntrance/ProductSelectionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  useGetCategoriesQuery,
  useGetStockProductsQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useGetUnitsOfMeasurementQuery,
} from '../../../../redux/slices/productsApiSlice';

const ProductSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const { data: products = [], isLoading: isLoadingProducts } = useGetStockProductsQuery();
  const { data: units = [] } = useGetUnitsOfMeasurementQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [createProduct] = useCreateProductMutation();

  const findUnitName = (unitId) => {
    if (!unitId) return 'шт.';
    const unit = units.find(u => u.id === unitId);
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
    return products.filter(product =>
      allCategoryIds.includes(product.category_id) && matchesSearch(product)
    );
  }, [selectedCategory, products, productSearchTerm]);

  const handleContextMenu = useCallback((e, category) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, category });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu, closeContextMenu]);

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategory?.id === category.id;

      return (
        <div key={category.id} className="ml-3">
          <div
            className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded truncate ${isSelected ? 'bg-blue-100' : ''
              }`}
            onClick={() => setSelectedCategory(category)}
            onContextMenu={(e) => handleContextMenu(e, category)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (category.children?.length) {
                setExpandedCategories(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(category.id)) newSet.delete(category.id);
                  else newSet.add(category.id);
                  return newSet;
                });
              }
            }}
          >
            {category.children?.length ? (
              <span className="mr-1">{isExpanded ? '▼' : '►'}</span>
            ) : (
              <span className="mr-1 text-gray-500">•</span>
            )}
            <span className="truncate">{category.name}</span>
          </div>
          {isExpanded && category.children?.length > 0 && (
            <div className="ml-3">
              {renderCategoryTree(category.children, level + 1)}
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
      const parentId = contextMenu?.category?.id || selectedCategory?.id || null;
      await createCategory({
        name: newCategoryName,
        parent_id: parentId
      }).unwrap();
      setNewCategoryName('');
      setIsCreatingCategory(false);
      closeContextMenu();
    } catch (err) {
      console.error('Ошибка создания категории:', err);
      alert('Не удалось создать категорию');
    }
  };

  const handleCreateProduct = () => {
    setNewProductName('');
    setNewProductDescription('');
    setNewProductCost('');
    setStep(2);
    if (contextMenu?.category) {
      setSelectedCategory(contextMenu.category);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      alert('Название товара обязательно');
      return;
    }
    if (!selectedCategory) {
      alert('Выберите категорию');
      return;
    }

    let costNum = 0;
    if (newProductCost.trim() !== '') {
      costNum = parseFloat(newProductCost);
      if (isNaN(costNum) || costNum < 0) {
        alert('Укажите корректную цену закупки');
        return;
      }
    }

    try {
      const newProduct = await createProduct({
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        category_id: selectedCategory.id,
      }).unwrap();

      onSelect(newProduct);
      onClose();
    } catch (err) {
      console.error('Ошибка создания товара:', err);
      alert('Не удалось создать товар');
    }
  };

  const handleSelectExistingProduct = (product) => {
    onSelect(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-full sm:w-3/5 max-h-[90vh] flex flex-col my-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold">
            {step === 1 ? 'Выберите категорию и товар' : 'Создайте товар'}
          </h3>
          {step === 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  setIsCreatingCategory(true);
                }}
                className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
              >
                Добавить категорию
              </button>
              <button
                type="button"
                onClick={handleCreateProduct}
                className="px-3 py-1.5 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
              >
                Добавить товар
              </button>
            </div>
          )}
        </div>

        {step === 1 ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Выбранная категория:</label>
              <div className="p-2 bg-gray-100 rounded text-sm truncate">
                {selectedCategory ? selectedCategory.name : 'Номенклатура'}
              </div>
            </div>

            {/* Десктоп: две колонки | Мобильный: одна колонка */}
            <div className="flex flex-col sm:flex-row gap-4 flex-grow min-h-0">
              {/* Дерево категорий */}
              <div className="sm:w-1/3 flex flex-col">
                <div className="text-sm font-medium mb-2">Категории</div>
                <div className="flex-grow overflow-y-auto mb-4 bg-gray-50 p-2 rounded">
                  <div
                    className={`py-2 px-3 cursor-pointer hover:bg-gray-100 rounded truncate ${!selectedCategory ? 'bg-blue-100' : ''
                      }`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, category: null });
                    }}
                    onClick={() => setSelectedCategory(null)}
                  >
                    <span className="font-medium">Номенклатура</span>
                  </div>

                  {isLoadingCategories ? (
                    <p className="text-sm">Загрузка...</p>
                  ) : (
                    renderCategoryTree(categories)
                  )}
                </div>
              </div>

              {/* Список товаров */}
              <div className="sm:w-2/3 flex flex-col min-h-0">
                <div className="text-sm font-medium mb-2">
                  Товары {selectedCategory ? `в "${selectedCategory.name}"` : 'во всей номенклатуре'}:
                </div>
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full p-2 mb-2 border border-gray-300 rounded text-sm"
                  placeholder="Введите название товара"
                />
                <div className="flex-grow overflow-y-auto min-h-0">
                  {isLoadingProducts ? (
                    <p className="text-sm">Загрузка товаров...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      {selectedCategory ? 'Нет товаров в этой категории' : 'Нет товаров'}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 sm:hidden">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-3 border border-gray-200 rounded bg-white hover:bg-gray-50"
                            onDoubleClick={() => handleSelectExistingProduct(product)}
                          >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {product.description || '—'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Остаток: {getProductStock(product)} {findUnitName(product.unit_id)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Мин. остаток: {product.min_stock || 0} {findUnitName(product.unit_id)}
                            </div>
                            <div className="text-sm font-medium text-green-800 mt-1">
                              {getProductPrice(product).toFixed(2)} ₽
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectExistingProduct(product);
                              }}
                              className="mt-2 w-full py-1.5 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200"
                            >
                              Выбрать
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleCreateProduct}
                          className="w-full p-3 border border-dashed border-green-400 rounded bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100"
                        >
                          + Добавить товар
                        </button>
                      </div>

                      <table className="hidden sm:table w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Название</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Описание</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Остаток</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Мин. остаток</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Ед. изм.</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-700">Цена</th>
                            <th className="px-2 py-2 text-right text-xs font-medium text-gray-700">Действие</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredProducts.map((product) => (
                            <tr
                              key={product.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onDoubleClick={() => handleSelectExistingProduct(product)}
                            >
                              <td className="px-2 py-2 text-xs text-gray-900">{product.name}</td>
                              <td className="px-2 py-2 text-xs text-gray-700 max-w-[100px] truncate" title={product.description || ''}>
                                {product.description || '—'}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900">{getProductStock(product)}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{product.min_stock || 0}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">{findUnitName(product.unit_id)}</td>
                              <td className="px-2 py-2 text-xs text-gray-900">
                                {getProductPrice(product).toFixed(2)} ₽
                              </td>
                              <td className="px-2 py-2 text-right text-xs">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectExistingProduct(product);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Выбрать
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-green-50">
                            <td colSpan="7" className="px-2 py-2 text-right text-xs">
                              <button
                                type="button"
                                onClick={handleCreateProduct}
                                className="text-green-700 hover:text-green-900 font-medium"
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

                <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Шаг 2: Создание товара
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория:</label>
              <div className="p-2 bg-gray-100 rounded text-sm truncate">
                {selectedCategory ? selectedCategory.name : 'Номенклатура'}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Название товара *</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Введите название"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Введите описание"
                rows="2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена закупки *</label>
              <input
                type="text" // ← изменено с "number" на "text"
                value={newProductCost}
                onChange={(e) => {
                  const value = e.target.value;
                  // Разрешаем пустое значение, цифры и одну точку/запятую
                  if (value === '' || /^(\d+\.?\d*|\.\d+)$/.test(value)) {
                    setNewProductCost(value);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              >
                Назад
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Создать товар
              </button>
            </div>
          </>
        )}

        {/* Контекстное меню */}
        {/* Контекстное меню — с адаптивной позицией */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border rounded shadow-lg py-1 min-w-[160px] text-sm"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 120), // также не уходить за низ
              left: Math.max(0, Math.min(contextMenu.x, window.innerWidth - 165)),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateProduct();
                closeContextMenu();
              }}
            >
              Добавить товар
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingCategory(true);
                closeContextMenu();
              }}
            >
              Добавить подкатегорию
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
              Памятка на удаление
            </button>
          </div>
        )}

        {/* Модалка создания категории */}
        {isCreatingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
              <h4 className="font-medium mb-2 text-sm">
                Создать категорию в:{" "}
                <span className="font-normal">
                  {contextMenu?.category ? contextMenu.category.name : 'Номенклатура'}
                </span>
              </h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-3 text-sm"
                placeholder="Введите имя категории"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSelectionModal;