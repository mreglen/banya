import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetProductsQuery,
  useGetUnitsOfMeasurementQuery,
  useReceiveEntranceStockMutation,
  useGetProductRequestReceiveItemsQuery,
} from '../../../../redux/slices/productsApiSlice';
import { useGetFinanceAccountsQuery } from '../../../../redux/slices/apiSlice';
import ProductSelectionModal from './ProductSelectionModal';
import { toast } from 'react-hot-toast';

const draftKey = (userId, requestId) =>
  `banya:entrance-receive:${userId || 'anon'}:${requestId || 'free'}`;

function ReceiveEntrance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId')
    ? Number(searchParams.get('requestId'))
    : null;

  const user = useSelector((state) => state.auth.user);
  const { data: products = [], isLoading: loadingProducts } = useGetProductsQuery();
  const { data: units = [] } = useGetUnitsOfMeasurementQuery();
  const { data: accounts = [] } = useGetFinanceAccountsQuery();
  const {
    data: requestItems = [],
    isLoading: loadingRequestItems,
  } = useGetProductRequestReceiveItemsQuery(requestId, { skip: !requestId });

  const [receiveStock, { isLoading: isReceiving }] = useReceiveEntranceStockMutation();

  const [items, setItems] = useState([]);
  const [comment, setComment] = useState('');
  const [accountId, setAccountId] = useState(null);
  const [updateSalePrices, setUpdateSalePrices] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const searchRef = useRef(null);
  const hydratedRef = useRef(false);

  const unitName = (unitId) => units.find((u) => u.id === unitId)?.name || 'шт.';

  const countableProducts = useMemo(
    () => (products || []).filter((p) => p.is_countable),
    [products]
  );

  const lowStock = useMemo(
    () =>
      countableProducts
        .filter((p) => (p.total_quantity || 0) < (p.min_stock || 0))
        .slice(0, 8),
    [countableProducts]
  );

  const searchResults = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const available = countableProducts.filter(
      (p) => !items.some((i) => i.productId === p.id)
    );
    if (!q) return available.slice(0, 30);
    return available.filter((p) => (p.name || '').toLowerCase().includes(q)).slice(0, 30);
  }, [productSearch, countableProducts, items]);

  // Load local draft or request items
  useEffect(() => {
    if (hydratedRef.current || loadingProducts) return;
    if (requestId && loadingRequestItems) return;

    const key = draftKey(user?.user_id, requestId);
    let restored = null;
    try {
      restored = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      restored = null;
    }

    if (requestId && requestItems.length) {
      setItems(
        requestItems.map((ri) => ({
          key: `req-${ri.id}`,
          productId: ri.product_id,
          name: ri.product?.name || `Товар #${ri.product_id}`,
          quantity: String(ri.quantity || ''),
          purchasePrice: ri.purchase_price ? String(Math.round(ri.purchase_price)) : '',
          unitId: ri.product?.unit_id || null,
        }))
      );
      setComment((prev) => prev || `Из заявки #${requestId}`);
    } else if (restored?.items?.length && !requestId) {
      setItems(restored.items);
      setComment(restored.comment || '');
      setAccountId(restored.accountId ?? null);
      setUpdateSalePrices(restored.updateSalePrices !== false);
    }
    hydratedRef.current = true;
  }, [
    loadingProducts,
    loadingRequestItems,
    requestId,
    requestItems,
    user?.user_id,
  ]);

  // Persist draft (free receive only)
  useEffect(() => {
    if (!hydratedRef.current || requestId) return;
    const key = draftKey(user?.user_id, null);
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ items, comment, accountId, updateSalePrices })
      );
    } catch {
      /* ignore */
    }
  }, [items, comment, accountId, updateSalePrices, user?.user_id, requestId]);

  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const addProduct = (product) => {
    if (!product?.is_countable) {
      toast.error('Неисчисляемый товар нельзя оприходовать');
      return;
    }
    if (items.some((i) => i.productId === product.id)) {
      toast.error('Товар уже в списке');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        key: `p-${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        quantity: '',
        purchasePrice:
          product.last_purchase_price > 0
            ? String(Math.round(product.last_purchase_price))
            : '',
        unitId: product.unit_id || null,
      },
    ]);
    setProductSearch('');
    setDropdownOpen(false);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const cleaned =
        field === 'quantity' || field === 'purchasePrice'
          ? value.replace(/\D/g, '')
          : value;
      next[index] = { ...next[index], [field]: cleaned };
      return next;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!items.length) {
      toast.error('Добавьте хотя бы один товар');
      return;
    }
    if (items.some((i) => !Number(i.quantity))) {
      toast.error('Укажите количество для всех товаров');
      return;
    }
    try {
      await receiveStock({
        date: new Date().toISOString().slice(0, 10),
        account_id: accountId,
        comment: comment || null,
        update_sale_prices: updateSalePrices,
        created_from_request_id: requestId || null,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: Number(item.quantity),
          purchase_price: Number(item.purchasePrice) || 0,
        })),
      }).unwrap();

      if (!requestId) {
        try {
          localStorage.removeItem(draftKey(user?.user_id, null));
        } catch {
          /* ignore */
        }
      }
      toast.success('Товары оприходованы');
      navigate('/admin/documents/entrance');
    } catch (err) {
      toast.error(err?.data?.detail || 'Не удалось оприходовать');
    }
  };

  if (loadingProducts || (requestId && loadingRequestItems)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center text-gray-600">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Оприходовать</h1>
            {requestId && (
              <p className="text-sm text-gray-500 mt-1">Из заявки #{requestId}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/documents/entrance')}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            Назад
          </button>
        </div>

        {!requestId && lowStock.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm font-medium text-gray-800 mb-2">Низкий остаток</div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                >
                  {p.name} ({p.total_quantity || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <div className="flex gap-2 items-stretch">
            <div ref={searchRef} className="relative flex-1 min-w-0">
              <input
                type="search"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Найти товар..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-webkit-search-cancel-button]:hidden"
              />
              {dropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        Остаток: {p.total_quantity || 0} {unitName(p.unit_id)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setIsCatalogOpen(true);
              }}
              className="shrink-0 px-3 sm:px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-800 flex items-center gap-1.5"
              title="Каталог по категориям"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Каталог</span>
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Добавьте товары для оприходования</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.key} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div className="font-medium text-gray-900 text-sm leading-snug">{item.name}</div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-gray-400 hover:text-red-600 text-sm shrink-0"
                    >
                      Убрать
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Кол-во ({unitName(item.unitId)})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Цена закупки ₽</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.purchasePrice}
                        onChange={(e) => updateItem(index, 'purchasePrice', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={updateSalePrices}
              onChange={(e) => setUpdateSalePrices(e.target.checked)}
              className="rounded border-gray-300"
            />
            Обновить продажные цены по наценке
          </label>

          {accounts.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Счёт (необязательно)</label>
              <select
                value={accountId ?? ''}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Не выбран</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name || `Счёт #${acc.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Комментарий</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Необязательно"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-gray-600">
              Итого: <span className="font-semibold text-gray-900">{total.toFixed(2)} ₽</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isReceiving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm"
            >
              {isReceiving ? 'Сохранение...' : 'Оприходовать'}
            </button>
          </div>
        </div>
      </div>

      <ProductSelectionModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelect={(product) => {
          addProduct(product);
          setIsCatalogOpen(false);
        }}
      />
    </div>
  );
}

export default ReceiveEntrance;
