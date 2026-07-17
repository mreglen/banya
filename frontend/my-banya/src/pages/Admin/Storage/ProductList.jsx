// src/pages/Admin/Storage/ProductList.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetUnitsOfMeasurementQuery } from '../../../redux/slices/productsApiSlice';
import { markForDeletion, unmarkForDeletion } from '../../../redux/slices/deletionRequestsSlice';
import ActionDropdown from '../../../components/UI/ActionDropdown/ActionDropdown';
import { useHasAccess } from '../../../hooks/useHasAccess';

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

const findCategoryById = (categories, categoryId) => {
    for (const cat of categories) {
        if (cat.id === categoryId) return cat;
        if (cat.children?.length) {
            const found = findCategoryById(cat.children, categoryId);
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
    const deletionArray = useSelector(state => state.deletionRequests);
    const { data: units = [] } = useGetUnitsOfMeasurementQuery();

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

    // Применить фильтр
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

    return (
        <div className="bg-white rounded-xl shadow-md">
            <div className="p-4 border-b">
                <h2 className="text-base sm:text-lg font-semibold">
                    {selectedCategoryPath.length > 0
                        ? `Товары в: ${selectedCategoryPath.map(c => c.name).join(' → ')}`
                        : 'Все товары'}
                </h2>
            </div>

            {finalProducts.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                    <p className="text-gray-500">
                        {searchQuery.trim() ? 'По запросу ничего не найдено' : 'Нет товаров в выбранной категории'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="hidden md:table md:table-auto w-full">
                        <thead className="bg-gray-50 text-left text-xs sm:text-sm text-gray-600 uppercase tracking-wider">
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
                                                actions={[
                                                    {
                                                        label: 'Редактировать',
                                                        icon: '',
                                                        color: 'blue',
                                                        onClick: (e) => {
                                                            e.stopPropagation();
                                                            handleEdit(product.id);
                                                        },
                                                    },
                                                    ...(canCreateRequest
                                                        ? [
                                                            {
                                                                label: 'Создать заявку',
                                                                icon: '',
                                                                color: 'green',
                                                                onClick: (e) => {
                                                                    e.stopPropagation();
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
                                                            e.stopPropagation();
                                                            if (markedForDeletion) {
                                                                dispatch(unmarkForDeletion(product.id));
                                                            } else {
                                                                dispatch(markForDeletion(product.id));
                                                                navigate('/admin/deletion-requests');
                                                            }
                                                        },
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Mobile Cards */}
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
                                            actions={[
                                                {
                                                    label: 'Редактировать',
                                                    icon: '',
                                                    color: 'blue',
                                                    onClick: () => handleEdit(product.id),
                                                },
                                                ...(canCreateRequest
                                                    ? [
                                                        {
                                                            label: 'Создать заявку',
                                                            icon: '',
                                                            color: 'green',
                                                            onClick: () =>
                                                                navigate(`/admin/documents/product-requests/add?productId=${product.id}`),
                                                        },
                                                    ]
                                                    : []),
                                                {
                                                    label: markedForDeletion ? 'Снять с удаления' : 'Пометить на удаление',
                                                    icon: markedForDeletion ? '✓' : '',
                                                    color: markedForDeletion ? 'green' : 'red',
                                                    onClick: () => {
                                                        if (markedForDeletion) {
                                                            dispatch(unmarkForDeletion(product.id));
                                                        } else {
                                                            dispatch(markForDeletion(product.id));
                                                            navigate('/admin/deletion-requests');
                                                        }
                                                    },
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;