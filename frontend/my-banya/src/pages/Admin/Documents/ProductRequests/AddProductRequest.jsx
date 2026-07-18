import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductSelectionModal from '../DocumentsEntrance/ProductSelectionModal';
import {
  setInitialState,
  updateField,
  addItem,
  updateItem,
  removeItem,
  resetForm,
} from '../../../../redux/slices/productRequestFormSlice';
import {
  useCreateProductRequestMutation,
  useUpdateProductRequestMutation,
  useGetProductRequestByIdQuery,
  useGetProductsQuery,
  useGetUnitsOfMeasurementQuery,
  useGetProductByIdQuery,
} from '../../../../redux/slices/productsApiSlice';
import { toast } from 'react-hot-toast';

function AddProductRequest() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const prefillProductId = Number(searchParams.get('productId'));

  const { date, comment, items } = useSelector((state) => state.productRequestForm);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);
  const productSearchRef = useRef(null);

  const { data: products = [] } = useGetProductsQuery();
  const { data: units = [] } = useGetUnitsOfMeasurementQuery();
  const {
    data: requestData,
    isLoading: isLoadingRequest,
    isError,
  } = useGetProductRequestByIdQuery(id, { skip: !isEditing });
  const { data: prefillProduct } = useGetProductByIdQuery(prefillProductId, {
    skip: !prefillProductId || isEditing || Number.isNaN(prefillProductId),
  });

  const [createRequest, { isLoading: isCreating }] = useCreateProductRequestMutation();
  const [updateRequest, { isLoading: isUpdating }] = useUpdateProductRequestMutation();

  const enhancedItems = useMemo(
    () =>
      items.map((item) => {
        const unit = units.find((u) => u.id === item.unitId);
        return {
          ...item,
          unitName: unit ? unit.name : item.unitName || 'шт.',
        };
      }),
    [items, units]
  );

  const filteredSearchProducts = useMemo(() => {
    const searchValue = productSearch.trim().toLowerCase();
    const available = (products || []).filter(
      (product) => !items.some((item) => item.productId === product.id)
    );
    if (!searchValue) return available.slice(0, 50);
    return available
      .filter((product) => product.name.toLowerCase().includes(searchValue))
      .slice(0, 50);
  }, [productSearch, products, items]);

  useEffect(() => {
    if (!isEditing) {
      dispatch(setInitialState({}));
      setPrefillDone(false);
      return;
    }

    if (!requestData) return;

    const pendingItems = (requestData.items || [])
      .filter((item) => item.status === 'pending')
      .map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product?.name || '—',
        quantity: item.quantity,
        purchasePrice: item.purchase_price,
        unitId: item.product?.unit_id || null,
        unitName: units.find((u) => u.id === item.product?.unit_id)?.name || 'шт.',
      }));
    dispatch(
      setInitialState({
        date: requestData.date,
        comment: requestData.comment || '',
        items: pendingItems,
      })
    );
    // units used only for display labels at load time; do not re-init on every units change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, requestData, dispatch]);

  useEffect(() => {
    if (isEditing || prefillDone || !prefillProduct) return;
    dispatch(
      addItem({
        id: Date.now() + Math.random(),
        productId: prefillProduct.id,
        name: prefillProduct.name,
        quantity: '',
        purchasePrice: '',
        lastPurchasePrice: prefillProduct.last_purchase_price || null,
        unitId: prefillProduct.unit_id || null,
        unitName: units.find((u) => u.id === prefillProduct.unit_id)?.name || 'шт.',
      })
    );
    setPrefillDone(true);
  }, [prefillProduct, isEditing, prefillDone, dispatch, units]);

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
    if (isError) navigate('/admin/documents/product-requests');
  }, [isError, navigate]);

  const handleSelectProduct = (product) => {
    if (items.some((item) => item.productId === product.id)) {
      toast.error('Товар уже добавлен в заявку');
      return;
    }
    dispatch(
      addItem({
        id: Date.now() + Math.random(),
        productId: product.id,
        name: product.name,
        quantity: '',
        purchasePrice: '',
        lastPurchasePrice: product.last_purchase_price || null,
        unitId: product.unit_id || null,
        unitName: units.find((u) => u.id === product.unit_id)?.name || 'шт.',
      })
    );
    setIsProductModalOpen(false);
    setProductSearch('');
    setIsProductDropdownOpen(false);
  };

  const updateItemInList = (index, field, value) => {
    if (field === 'quantity' || field === 'purchasePrice') {
      if (value === '') {
        dispatch(updateItem({ index, field, value: '' }));
        return;
      }
      const digitsOnly = String(value).replace(/[^\d.]/g, '');
      dispatch(updateItem({ index, field, value: digitsOnly }));
      return;
    }
    dispatch(updateItem({ index, field, value }));
  };

  const handleSave = async () => {
    if (!items.length) {
      toast.error('Добавьте хотя бы один товар');
      return;
    }

    const payload = {
      date,
      comment: comment || null,
      items: items.map((item) => ({
        product_id: item.productId,
        quantity: Number(item.quantity) || 0,
        purchase_price: Number(item.purchasePrice) || 0,
      })),
    };

    if (payload.items.some((item) => item.quantity <= 0)) {
      toast.error('Количество должно быть больше 0');
      return;
    }

    try {
      if (isEditing) {
        await updateRequest({ id: Number(id), ...payload }).unwrap();
        toast.success('Заявка обновлена');
      } else {
        await createRequest(payload).unwrap();
        toast.success('Заявка создана');
      }
      dispatch(resetForm());
      navigate('/admin/documents/product-requests');
    } catch (err) {
      const detail = err?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
        : detail || 'Не удалось сохранить заявку';
      toast.error(message);
    }
  };

  if (isEditing && isLoadingRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isEditing ? `Редактирование заявки #${id}` : 'Новая заявка на товар'}
          </h1>
          <button
            onClick={() => navigate('/admin/documents/product-requests')}
            className="text-gray-600 hover:text-gray-900"
          >
            Назад
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-4 sm:p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => dispatch(updateField({ field: 'date', value: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => dispatch(updateField({ field: 'comment', value: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Необязательно"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Позиции</h2>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="text-sm text-green-700 hover:text-green-900 font-medium"
              >
                + Из каталога
              </button>
            </div>

            <div className="relative mb-3" ref={productSearchRef}>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductDropdownOpen(true);
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                placeholder="Поиск товара..."
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              {isProductDropdownOpen && filteredSearchProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow max-h-56 overflow-auto">
                  {filteredSearchProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      onClick={() => handleSelectProduct(product)}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {enhancedItems.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center border rounded-lg">
                Добавьте товары в заявку
              </p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="px-3 py-2">Товар</th>
                      <th className="px-3 py-2 w-28">Кол-во</th>
                      <th className="px-3 py-2 w-32">Цена закупки</th>
                      <th className="px-3 py-2 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {enhancedItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          {item.name}
                          <div className="text-xs text-gray-500">{item.unitName}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.quantity ?? ''}
                            onChange={(e) => updateItemInList(index, 'quantity', e.target.value)}
                            placeholder="0"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.purchasePrice ?? ''}
                            onChange={(e) => updateItemInList(index, 'purchasePrice', e.target.value)}
                            placeholder={item.lastPurchasePrice != null ? String(item.lastPurchasePrice) : '0'}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => dispatch(removeItem(index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                dispatch(resetForm());
                navigate('/admin/documents/product-requests');
              }}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={isCreating || isUpdating}
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isCreating || isUpdating ? 'Сохранение...' : 'Сохранить заявку'}
            </button>
          </div>
        </div>
      </div>

      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleSelectProduct}
      />
    </div>
  );
}

export default AddProductRequest;
