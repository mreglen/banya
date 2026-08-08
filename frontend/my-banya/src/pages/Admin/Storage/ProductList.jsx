// src/pages/Admin/Storage/ProductList.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    useGetUnitsOfMeasurementQuery,
    useWriteOffProductMutation,
} from '../../../redux/slices/productsApiSlice';
import { markForDeletion, unmarkForDeletion } from '../../../redux/slices/deletionRequestsSlice';
import ActionDropdown from '../../../components/UI/ActionDropdown/ActionDropdown';
import { useHasAccess } from '../../../hooks/useHasAccess';
import { toast } from 'react-hot-toast';

const truncateDescription = (str, maxLength = 50) => {
    if (!str) return '—';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
};

const findCategoryName = (categories, categoryId) => {
    for (const cat of categories) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children?.length) {
            const found = findCategoryName(cat.children, categoryId);
            if (found) return found;
        }
    }
    return null;
};

const getProductsForSelectedCategory = (selectedCategoryPath, categoriesTree, storageData) => {
    if (selectedCategoryPath.length === 0) return storageData;

    const lastCategory = selectedCategoryPath[selectedCategoryPath.length - 1];
    const categoryId = lastCategory.id;

    const findCategoryById = (categories, id) => {
        for (const cat of categories) {
            if (cat.id === id) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = findCategoryById(cat.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const collectSubcategoryIds = (category) => {
        let ids = [category.id];
        if (category.children && category.children.length > 0) {
            for (const child of category.children) {
                ids = [...ids, ...collectSubcategoryIds(child)];
            }
        }
        return ids;
    };

    const rootCategory = findCategoryById(categoriesTree, categoryId);
    if (!rootCategory) return [];

    const allCategoryIds = collectSubcategoryIds(rootCategory);
    return storageData.filter(item => allCategoryIds.includes(item.category_id));
};

const ProductList = ({
    selectedCategoryPath,
    categoriesTree,
    storageData,
    handleEdit,
    filterType,
    searchQuery = '',
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const hasAccess = useHasAccess();
    const canCreateRequest = hasAccess('documents:manage');
    const canManageStorage = hasAccess('storage:manage');
    const deletionArray = useSelector(state => state.deletionRequests);
    const { data: units = [] } = useGetUnitsOfMeasurementQuery();
    const [writeOffProduct, { isLoading: isWritingOff }] = useWriteOffProductMutation();

    const [writeOffProductItem, setWriteOffProductItem] = useState(null);
    const [writeOffQty, setWriteOffQty] = useState('');

    const findUnitName = (unitId) => {
        if (!unitId) return 'шт.';
        const unit = units.find(u => u.id === unitId);
        return unit ? unit.name : 'шт.';
    };

    const filteredProducts = getProductsForSelectedCategory(
        selectedCategoryPath,
        categoriesTree,
        storageData
    );

    const lowStockFilteredProducts = filterType === 'min_stock'
        ? filteredProducts.filter(p => p.is_countable && (p.total_quantity || 0) < (p.min_stock || 0))
        : filteredProducts;

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const finalProducts = normalizedSearch
        ? lowStockFilteredProducts.filter((product) => {
            const categoryName = (findCategoryName(categoriesTree, product.category_id) || '').toLowerCase();
            const name = (product.name || '').toLowerCase();
            const description = (product.description || '').toLowerCase();
            return (
                name.includes(normalizedSearch) ||
                description.includes(normalizedSearch) ||
                categoryName.includes(normalizedSearch)
            );
        })
        : lowStockFilteredProducts;

    const openWriteOff = (product) => {
        setWriteOffProductItem(product);
        setWriteOffQty('');
    };

    const closeWriteOff = () => {
        setWriteOffProductItem(null);
        setWriteOffQty('');
    };

    const handleWriteOffSubmit = async (e) => {
        e.preventDefault();
        if (!writeOffProductItem) return;
        const qty = Number(writeOffQty);
        const stock = Number(writeOffProductItem.total_quantity) || 0;
        if (!qty || qty <= 0) {
            toast.error('Укажите количество');
            return;
        }
        if (qty > stock) {
            toast.error(`Нельзя списать больше остатка (${stock})`);
            return;
        }
        try {
            await writeOffProduct({ id: writeOffProductItem.id, quantity: qty }).unwrap();
            toast.success('Списано');
            closeWriteOff();
        } catch (err) {
            toast.error(err?.data?.detail || 'Не удалось списать');
        }
    };

    const buildActions = (product, markedForDeletion) => [
        {
            label: 'Редактировать',
            icon: '',
            color: 'blue',
            onClick: (e) => {
                e?.stopPropagation?.();
                handleEdit(product.id);
            },
        },
        ...(canManageStorage
            ? [
                {
                    label: 'Списать',
                    icon: '',
                    color: 'orange',
                    onClick: (e) => {
                        e?.stopPropagation?.();
                        openWriteOff(product);
                    },
                },
            ]
            : []),
        ...(canCreateRequest
            ? [
                {
                    label: 'Создать заявку',
                    icon: '',
                    color: 'green',
                    onClick: (e) => {
                        e?.stopPropagation?.();
                        navigate(`/admin/documents/product-requests/add?productId=${product.id}`);
                    },
                },
            ]
            : []),
        {
            label: markedForDeletion ? 'Снять с удаления' : 'Пометить на удаление',
            icon: markedForDeletion ? '✓' : '',
            color: markedForDeletion ? 'green' : 'red',
            onClick: (e) => {
                e?.stopPropagation?.();
                if (markedForDeletion) {
                    dispatch(unmarkForDeletion(product.id));
                } else {
                    dispatch(markForDeletion(product.id));
                    navigate('/admin/deletion-requests');
                }
            },
        },
    ];

    const writeOffUnit = writeOffProductItem
        ? findUnitName(writeOffProductItem.unit_id)
        : 'шт.';

    return (
        <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                    {selectedCategoryPath.length > 0
                        ? selectedCategoryPath[selectedCategoryPath.length - 1].name
                        : 'Все товары'}
                </h2>
            </div>

            {finalProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Нет товаров</div>
            ) : (
                <div>
                    <table className="hidden md:table w-full table-fixed">
                        <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
                            <tr>
                                <th className="px-4 py-3 w-[25%]">Наименование</th>
                                <th className="px-4 py-3 w-[20%]">Категория</th>
                                <th className="px-4 py-3 w-[25%]">Описание</th>
                                <th className="px-4 py-3 w-[10%] text-right">Остаток</th>
                                <th className="px-4 py-3 w-[8%] text-right">Цена</th>
                                <th className="px-4 py-3 w-[8%] text-center">Сайт</th>
                                <th className="px-4 py-3 w-[10%] text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {finalProducts.map((product) => {
                                const categoryName = findCategoryName(categoriesTree, product.category_id);
                                const markedForDeletion = deletionArray.includes(product.id);
                                const unitName = findUnitName(product.unit_id);

                                return (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onDoubleClick={() => handleEdit(product.id)}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900 w-[25%]">{product.name}</td>
                                        <td className="px-4 py-3 text-gray-700 w-[20%]">{categoryName || '—'}</td>
                                        <td className="px-4 py-3 text-gray-700 w-[25%]">{truncateDescription(product.description, 50)}</td>
                                        <td className={`px-4 py-3 w-[10%] text-right ${(product.total_quantity || 0) < (product.min_stock || 0) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>{(product.total_quantity || 0)} {unitName}</td>
                                        <td className="px-4 py-3 text-gray-900 w-[8%] text-right">{(product.price ?? 0).toFixed(2)} ₽</td>
                                        <td className="px-4 py-3 w-[8%] text-center">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(product.is_visible_on_website)}
                                                readOnly
                                                disabled
                                                tabIndex={-1}
                                                aria-label={product.is_visible_on_website ? 'На сайте' : 'Не на сайте'}
                                                className="cursor-not-allowed opacity-80"
                                            />
                                        </td>
                                        <td className="px-4 py-3 w-[10%] text-center overflow-visible">
                                            <ActionDropdown
                                                buttonText="⋮"
                                                actions={buildActions(product, markedForDeletion)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="md:hidden p-2">
                        {finalProducts.map((product) => {
                            const categoryName = findCategoryName(categoriesTree, product.category_id);
                            const markedForDeletion = deletionArray.includes(product.id);
                            const unitName = findUnitName(product.unit_id);

                            return (
                                <div
                                    key={product.id}
                                    className="border rounded-lg p-4 mb-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                    onDoubleClick={() => handleEdit(product.id)}
                                >
                                    <div className="font-semibold">{product.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Категория: {categoryName || '—'}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        Описание: {truncateDescription(product.description, 60)}
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-sm">
                                        <span className={(product.total_quantity || 0) < (product.min_stock || 0) ? 'text-red-600 font-semibold' : ''}>Остаток: {(product.total_quantity || 0)} {unitName}</span>
                                        <span>{(product.price ?? 0).toFixed(2)} ₽</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                        <span>Сайт:</span>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(product.is_visible_on_website)}
                                            readOnly
                                            disabled
                                            tabIndex={-1}
                                            className="cursor-not-allowed opacity-80"
                                        />
                                    </div>
                                    <div className="flex justify-end items-center mt-2">
                                        <ActionDropdown
                                            buttonText="Действия"
                                            actions={buildActions(product, markedForDeletion)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {writeOffProductItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form
                        onSubmit={handleWriteOffSubmit}
                        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900">Списать</h3>
                        <div className="text-sm text-gray-800">
                            <div className="font-medium">{writeOffProductItem.name}</div>
                            <div className="text-gray-600 mt-1">
                                Сейчас: {Number(writeOffProductItem.total_quantity) || 0} {writeOffUnit}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Списать</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={writeOffQty}
                                onChange={(e) => setWriteOffQty(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={closeWriteOff}
                                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={isWritingOff}
                                className="px-4 py-2 rounded-lg bg-orange-600 text-white disabled:opacity-50"
                            >
                                {isWritingOff ? '...' : 'Списать'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProductList;
