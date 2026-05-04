import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ContractorModal from './ContractorModal';
import ProductSelectionModal from './ProductSelectionModal';
import {
  setInitialState,
  updateField,
  setSupplier,
  addItem,
  updateItem,
  removeItem,
  resetForm,
} from '../../../../redux/slices/documentEntranceFormSlice';
import {
  useGetEntranceDocumentByIdQuery,
  useCreateEntranceDocumentMutation,
  useUpdateEntranceDocumentMutation,
  useGetUnitsOfMeasurementQuery,
  useGetProductsQuery,
} from '../../../../redux/slices/productsApiSlice';
import {
  useGetPartnersQuery,
} from '../../../../redux/slices/apiSlice';

function AddDocumentEntrance() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { date, supplierId, responsibleName, supplierNumber, comment, items } = useSelector(
    (state) => state.documentEntranceForm
  );

  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productSearchRef = useRef(null);

  // --- RTK Query ---
  const { data: partnersData = [], isLoading: isLoadingPartners } = useGetPartnersQuery();
  const { data: units = [], isLoading: isLoadingUnits } = useGetUnitsOfMeasurementQuery();
  const { data: products = [] } = useGetProductsQuery();
  const {
    data: documentData,
    isLoading: isLoadingDoc,
    isError: isDocError,
  } = useGetEntranceDocumentByIdQuery(id, { skip: !isEditing });

  const [createDocument, { isLoading: isCreating }] = useCreateEntranceDocumentMutation();
  const [updateDocument, { isLoading: isUpdating }] = useUpdateEntranceDocumentMutation();

  const isLoading = isLoadingPartners || isLoadingDoc || isLoadingUnits;

  const enhancedItems = useMemo(() => {
    return items.map(item => {
      const unit = units.find(u => u.id === item.unitId);
      const product = products?.find(p => p.id === item.productId);
      return {
        ...item,
        unitName: unit ? unit.name : 'шт.',
        minStock: product?.min_stock || 0,
      };
    });
  }, [items, units, products]);

  const filteredSearchProducts = useMemo(() => {
    const searchValue = productSearch.trim().toLowerCase();
    const availableProducts = (products || []).filter(
      (product) => !items.some((item) => item.productId === product.id)
    );

    if (!searchValue) {
      return availableProducts.slice(0, 50);
    }

    return availableProducts
      .filter((product) => product.name.toLowerCase().includes(searchValue))
      .slice(0, 50);
  }, [productSearch, products, items]);

  const selectedProductWithUnit = useMemo(() => {
    if (!selectedProduct) return null;
    const unit = units.find(u => u.id === selectedProduct.unit_id);
    return {
      ...selectedProduct,
      unitName: unit ? unit.name : 'шт.'
    };
  }, [selectedProduct, units]);

  useEffect(() => {
    if (isEditing && documentData && !isLoadingUnits) {
      const parsedItems = documentData.items.map((item) => {
        const unitName = units.find(u => u.id === item.product?.unit_id)?.name || 'шт.';
        return {
          id: item.id,
          productId: item.product_id,
          name: item.product?.name || '—',
          quantity: item.quantity,
          purchasePrice: item.purchase_price,
          unitId: item.product?.unit_id || null,
          unitName: unitName,
        };
      });

      dispatch(
        setInitialState({
          date: documentData.date,
          supplierId: documentData.supplier_id,
          responsibleName: documentData.responsible_name,
          supplierNumber: documentData.supplier_number || '',
          comment: documentData.comment || '',
          items: parsedItems,
        })
      );
    } else if (!isEditing && !isLoadingUnits) {
      let loggedUsername = localStorage.getItem('logged_in_username') || 'admin';
      const savedUserRaw = localStorage.getItem('user');
      if (savedUserRaw) {
        try {
          const savedUser = JSON.parse(savedUserRaw);
          if (savedUser?.full_name) {
            loggedUsername = savedUser.full_name;
          }
        } catch {
          // noop
        }
      }
      if (!responsibleName) {
        dispatch(setInitialState({ responsibleName: loggedUsername }));
      }
    }
  }, [isEditing, documentData, dispatch, responsibleName, units, isLoadingUnits]);

  useEffect(() => {
    if (selectedProductWithUnit) {
      setProductSearch(`${selectedProductWithUnit.name} (${selectedProductWithUnit.unitName})`);
    }
  }, [selectedProductWithUnit]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDocError) {
      navigate('/admin/documents/entrance');
    }
  }, [isDocError, navigate]);

  const handleContractorSelect = (partner) => {
    dispatch(setSupplier(partner.partner_id));
    setIsContractorModalOpen(false);
  };

  const handleSelectProductFromModal = (product) => {
    const unit = units.find(u => u.id === product.unit_id);
    const newItem = {
      id: Date.now() + Math.random(),
      productId: product.id,
      name: product.name,
      quantity: 1,
      purchasePrice: product.last_purchase_price || 0,
      unitId: product.unit_id || null,
      unitName: unit ? unit.name : 'шт.',
      minStock: product.min_stock || 0,
    };
    dispatch(addItem(newItem));
    setIsProductModalOpen(false);
    setSelectedProduct(product);
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };

  const handleSelectProductFromSearch = (product) => {
    handleSelectProductFromModal(product);
  };

  const updateItemInList = (index, field, value) => {
    if (field === 'quantity') {
      if (value === '') {
        dispatch(updateItem({ index, field, value: '' }));
        return;
      }
      const digitsOnly = value.replace(/\D/g, '');
      dispatch(updateItem({ index, field, value: digitsOnly }));
      return;
    }

    if (field === 'purchasePrice') {
      if (value === '') {
        dispatch(updateItem({ index, field, value: '' }));
        return;
      }
      const digitsOnly = value.replace(/\D/g, '');
      dispatch(updateItem({ index, field, value: digitsOnly }));
      return;
    }

    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    dispatch(updateItem({ index, field, value: numValue }));
  };

  const removeItemFromList = (index) => {
    dispatch(removeItem(index));
  };

  const handleOpenContractorModal = () => setIsContractorModalOpen(true);
  const handleCloseContractorModal = () => setIsContractorModalOpen(false);
  const handleOpenProductModal = () => setIsProductModalOpen(true);
  const handleCloseProductModal = () => setIsProductModalOpen(false);

  const updateDocumentData = (field, value) => {
    dispatch(updateField({ field, value }));
  };

  const handleSaveDocument = async () => {
    const total = items.reduce((sum, item) => sum + item.quantity * (Number(item.purchasePrice) || 0), 0);
    const documentPayload = {
      date,
      supplier_id: supplierId,
      responsible_name: responsibleName,
      supplier_number: supplierNumber,
      comment: comment || null,
      total_amount: total,
      items: items.map((item) => ({
        product_id: item.productId,
        quantity: Number(item.quantity) || 0,
        purchase_price: Number(item.purchasePrice) || 0,
      })),
    };

    try {
      if (isEditing) {
        await updateDocument({ id: parseInt(id), ...documentPayload }).unwrap();
      } else {
        await createDocument(documentPayload).unwrap();
      }

      dispatch(resetForm());
      navigate('/admin/documents/entrance');
    } catch (error) {
      console.error('Ошибка сохранения документа:', error);
    }
  };

  const handleItemDoubleClick = (productId) => {
    const currentPath = window.location.pathname;
    navigate(`/admin/storage/product/${productId}`, { state: { from: currentPath } });
  };

  const currentUrl = window.location.pathname + window.location.search;
  const selectedPartner = partnersData.find((p) => p.partner_id === supplierId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex justify-center items-center">
        <p className="text-base">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isEditing ? 'Редактирование документа поступления' : 'Поступление товаров'}
          </h1>
          <button
            onClick={handleSaveDocument}
            disabled={isCreating || isUpdating}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium shadow transition text-sm sm:text-base flex items-center justify-center space-x-1 sm:space-x-2 ${isCreating || isUpdating
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            {!isEditing && !isCreating && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span>
              {isEditing
                ? isUpdating
                  ? 'Сохранение...'
                  : 'Сохранить изменения'
                : isCreating
                  ? 'Создание...'
                  : 'Создать документ'}
            </span>
          </button>
        </div>

        {/* Блок поставщика и данных — ВОЗВРАЩАЕМ СТАРУЮ СТРУКТУРУ */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 mb-6 border border-gray-100">
          <div className="space-y-4">
            {/* Первая строка: Поставщик | Номер поставщика | Дата */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Поставщик *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={selectedPartner?.supplier_name || ''}
                    readOnly
                    className="flex-grow px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-100 text-sm"
                    placeholder="Не выбран"
                  />
                  <button
                    onClick={handleOpenContractorModal}
                    className="px-3 py-2 sm:px-4 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-medium shadow transition text-xs sm:text-sm"
                    disabled={isEditing}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Номер поставщика</label>
                <input
                  type="text"
                  value={supplierNumber || ''}
                  onChange={(e) => updateDocumentData('supplierNumber', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm"
                  placeholder="Номер"
                  disabled={isEditing}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => updateDocumentData('date', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm"
                  disabled={isEditing}
                />
              </div>
            </div>

            {/* Вторая строка: Ответственный | Номер документа */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Ответственный *</label>
                <input
                  type="text"
                  value={responsibleName || ''}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-100 text-sm"
                  placeholder="—"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Номер документа</label>
                <input
                  type="text"
                  value={isEditing ? `${id}` : '—'}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl bg-gray-100 text-sm"
                  placeholder="—"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Комментарий</label>
              <textarea
                value={comment || ''}
                onChange={(e) => updateDocumentData('comment', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm"
                placeholder="Комментарий к документу"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Блок добавления товара */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 mb-6 border border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Добавить товар</h2>
          <div className="mb-4 relative" ref={productSearchRef}>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Выберите товар</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductDropdownOpen(true);
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                className="flex-grow px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm"
                placeholder="Начните вводить название товара"
              />
              <button
                onClick={handleOpenProductModal}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-medium shadow transition text-xs sm:text-sm"
              >
                + Добавить товар
              </button>
            </div>

            {isProductDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {filteredSearchProducts.map((product) => {
                  const unit = units.find((u) => u.id === product.unit_id);
                  const unitName = unit ? unit.name : 'шт.';
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProductFromSearch(product)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-600">Ед. изм.: {unitName}</div>
                    </button>
                  );
                })}

                {filteredSearchProducts.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Товары не найдены</div>
                )}

                <button
                  type="button"
                  onClick={handleOpenProductModal}
                  className="w-full text-left px-3 py-2 font-medium text-green-700 hover:bg-green-50 border-t border-gray-200"
                >
                  + Добавить новый товар
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Таблица товаров — Desktop */}
        {enhancedItems.length > 0 && (
          <>
            <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">№</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Номенклатура</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Кол-во</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Мин. остаток</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Ед. изм.</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Цена</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase">Сумма</th>
                    <th className="px-3 py-2 sm:px-6 sm:py-4 text-right text-xs sm:text-sm font-medium text-gray-700 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enhancedItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => handleItemDoubleClick(item.productId)}
                    >
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{item.name}</td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onChange={(e) => updateItemInList(index, 'quantity', e.target.value)}
                            className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded"
                            disabled={isEditing}
                          />
                          <span className="text-xs sm:text-sm text-gray-600">{item.unitName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.minStock || 0} {item.unitName}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.unitName}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.purchasePrice}
                          onChange={(e) => updateItemInList(index, 'purchasePrice', e.target.value)}
                          className="w-20 sm:w-24 px-2 py-1 border border-gray-300 rounded"
                          disabled={isEditing}
                        />
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {(item.quantity * item.purchasePrice).toFixed(2)} ₽
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItemFromList(index);
                          }}
                          className="text-red-600 hover:text-red-900 transition text-xs sm:text-sm"
                          disabled={isEditing}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Карточки товаров — Mobile */}
            <div className="md:hidden space-y-3 mb-6">
              {enhancedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow p-3 hover:shadow-md cursor-pointer"
                  onDoubleClick={() => handleItemDoubleClick(item.productId)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-800 text-sm">
                        {(item.quantity * item.purchasePrice).toFixed(2)} ₽
                      </div>
                    </div>
                  </div>

                  {/* Карточки товаров — Mobile */}
                  <div className="md:hidden space-y-4 mb-6">
                    {enhancedItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow p-4 border border-gray-200"
                      >
                        {/* № и Номенклатура */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs text-gray-500">№</span>
                            <span className="ml-1 font-medium text-sm">{index + 1}</span>
                          </div>
                          <div
                            className="text-right cursor-pointer hover:underline"
                            onClick={() => handleItemDoubleClick(item.productId)}
                          >
                            <div className="font-medium text-sm text-gray-900">{item.name}</div>
                          </div>
                        </div>

                        {/* Редактируемые поля */}
                        <div className="space-y-3 text-xs text-gray-700">
                          {/* Количество + Ед. изм. */}
                          <div>
                            <label className="block font-medium mb-1">Количество</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.quantity}
                                onChange={(e) => updateItemInList(index, 'quantity', e.target.value)}
                                className="flex-grow px-2 py-1.5 border border-gray-300 rounded bg-white"
                                disabled={isEditing}
                              />
                              <span className="text-gray-600 min-w-max">{item.unitName}</span>
                            </div>
                          </div>

                          {/* Минимальный остаток */}
                          <div>
                            <label className="block font-medium mb-1">Минимальный остаток</label>
                            <div className="px-2 py-1.5 bg-gray-100 rounded text-gray-900">
                              {item.minStock || 0} {item.unitName}
                            </div>
                          </div>

                          {/* Цена закупки */}
                          <div>
                            <label className="block font-medium mb-1">Цена закупки</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.purchasePrice}
                              onChange={(e) => updateItemInList(index, 'purchasePrice', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                              disabled={isEditing}
                            />
                          </div>

                          {/* Сумма (только для чтения) */}
                          <div>
                            <label className="block font-medium mb-1">Сумма</label>
                            <div className="px-2 py-1.5 bg-gray-100 rounded text-gray-900">
                              {(item.quantity * item.purchasePrice).toFixed(2)} ₽
                            </div>
                          </div>
                        </div>

                        {/* Кнопка удаления */}
                        {!isEditing && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItemFromList(index);
                              }}
                              className="text-xs bg-red-100 text-red-800 px-2.5 py-1.5 rounded hover:bg-red-200 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!isEditing && (
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItemFromList(index);
                        }}
                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                      >
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Итоговая сумма */}
        {enhancedItems.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl w-full sm:w-auto">
              <div className="text-sm sm:text-base font-semibold text-center sm:text-right">
                Итого: <span className="text-green-700">
                  {enhancedItems.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0).toFixed(2)} ₽
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ContractorModal
        isOpen={isContractorModalOpen}
        onClose={handleCloseContractorModal}
        onSelect={handleContractorSelect}
        currentUrl={currentUrl}
      />

      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        onSelect={handleSelectProductFromModal}
      />
    </div>
  );
}

export default AddDocumentEntrance;