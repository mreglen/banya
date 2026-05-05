import { useState, useEffect, useRef } from 'react';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../../redux/slices/settingsApiSlice';
import { 
  useGetUnitsOfMeasurementQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation
} from '../../../redux/slices/productsApiSlice';
import ActionDropdown from '../../../components/UI/ActionDropdown/ActionDropdown';
import SettingsSkeleton from './SettingsSkeleton';

function SettingsPage() {
  const { data: settings, isLoading, isError, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  const { data: units = [], isLoading: isLoadingUnits, refetch: refetchUnits } = useGetUnitsOfMeasurementQuery();
  const [createUnit, { isLoading: isCreatingUnit }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdatingUnit }] = useUpdateUnitMutation();
  const [deleteUnit, { isLoading: isDeletingUnit }] = useDeleteUnitMutation();

  const [cleaningTime, setCleaningTime] = useState('30');
  const [bookingInterval, setBookingInterval] = useState('30');
  const [markupPercent, setMarkupPercent] = useState('0');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const lastSavedMarkup = useRef(0);
  const pendingSettingsPayload = useRef(null);
  const [showMarkupConfirmModal, setShowMarkupConfirmModal] = useState(false);
  const [updateManualPrices, setUpdateManualPrices] = useState(false);

  // Unit management state
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitName, setUnitName] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    if (settings) {
      setCleaningTime(String(settings.cleaning_time_minutes || 30));
      setBookingInterval(String(settings.booking_interval_minutes || 30));
      const m =
        settings.markup_percent !== undefined && settings.markup_percent !== null
          ? Number(settings.markup_percent)
          : 0;
      setMarkupPercent(String(m));
      lastSavedMarkup.current = m;
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const cleaningTimeValue = parseInt(cleaningTime, 10);
    const bookingIntervalValue = parseInt(bookingInterval, 10);
    const markupStr = String(markupPercent).trim().replace(',', '.');
    const markupNum = parseFloat(markupStr);

    if (cleaningTime === '' || bookingInterval === '' || markupStr === '') {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }

    if (isNaN(cleaningTimeValue) || isNaN(bookingIntervalValue) || Number.isNaN(markupNum)) {
      setErrorMessage('Значения должны быть числами');
      return;
    }

    if (cleaningTimeValue < 0 || bookingIntervalValue < 0) {
      setErrorMessage('Время уборки и промежуток должны быть неотрицательными числами');
      return;
    }

    if (markupNum < 0) {
      setErrorMessage('Наценка не может быть отрицательной');
      return;
    }

    const basePayload = {
      cleaning_time_minutes: cleaningTimeValue,
      booking_interval_minutes: bookingIntervalValue,
    };

    const markupChanged = Math.abs(markupNum - lastSavedMarkup.current) > 1e-9;

    if (markupChanged) {
      pendingSettingsPayload.current = { ...basePayload, markup_percent: markupNum };
      setUpdateManualPrices(false);
      setShowMarkupConfirmModal(true);
      return;
    }

    try {
      await updateSettings(basePayload).unwrap();
      setSuccessMessage('Настройки успешно сохранены');
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.detail || 'Ошибка при сохранении настроек');
    }
  };

  const handleConfirmMarkupSave = async () => {
    if (!pendingSettingsPayload.current) return;
    setErrorMessage('');
    try {
      await updateSettings({
        ...pendingSettingsPayload.current,
        update_manual_prices: updateManualPrices,
      }).unwrap();
      setShowMarkupConfirmModal(false);
      pendingSettingsPayload.current = null;
      setSuccessMessage('Настройки успешно сохранены');
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.detail || 'Ошибка при сохранении настроек');
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) {
      setErrorMessage('Введите название единицы измерения');
      return;
    }

    try {
      await createUnit({
        name: unitName.trim(),
        description: unitDescription.trim() || null
      }).unwrap();
      setUnitName('');
      setUnitDescription('');
      setShowAddUnit(false);
      setSuccessMessage('Единица измерения добавлена');
      refetchUnits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.detail || 'Ошибка при добавлении единицы измерения');
    }
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitDescription(unit.description || '');
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) {
      setErrorMessage('Введите название единицы измерения');
      return;
    }

    try {
      await updateUnit({
        id: editingUnit.id,
        name: unitName.trim(),
        description: unitDescription.trim() || null
      }).unwrap();
      setUnitName('');
      setUnitDescription('');
      setEditingUnit(null);
      setSuccessMessage('Единица измерения обновлена');
      refetchUnits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.detail || 'Ошибка при обновлении единицы измерения');
    }
  };

  const handleDeleteRequest = (unitId) => {
    setDeleteConfirmId(unitId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteUnit(deleteConfirmId).unwrap();
      setSuccessMessage('Единица измерения удалена');
      refetchUnits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.data?.detail || 'Ошибка при удалении единицы измерения');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const cancelUnitForm = () => {
    setShowAddUnit(false);
    setEditingUnit(null);
    setUnitName('');
    setUnitDescription('');
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-lg text-red-600">Ошибка загрузки настроек</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Настройки</h1>
          <p className="text-gray-600 mt-2">Управление параметрами бронирования</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="markupPercent" className="block text-sm font-medium text-gray-700 mb-2">
                Наценка на товары (%)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Цена товара = цена закупки × (1 + наценка / 100). Дробные значения допускаются (например 27.5).
              </p>
              <input
                type="text"
                id="markupPercent"
                inputMode="decimal"
                value={markupPercent}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^-?\d*[.,]?\d*$/.test(v)) setMarkupPercent(v.replace(',', '.'));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </form>
        </div>

        {/* Units of Measurement Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Единицы измерения</h2>
              <p className="text-sm text-gray-600 mt-1">Управление единицами измерения для товаров</p>
            </div>
            <button
              onClick={() => setShowAddUnit(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
              + Добавить единицу
            </button>
          </div>

          {isLoadingUnits ? (
            <div className="text-center py-8 text-gray-600">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{unit.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{unit.description || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionDropdown
                          actions={[
                            {
                              label: 'Редактировать',
                              icon: '✏️',
                              color: 'green',
                              onClick: () => handleEditUnit(unit),
                            },
                            {
                              label: 'Удалить',
                              icon: '🗑️',
                              color: 'red',
                              onClick: () => handleDeleteRequest(unit.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add/Edit Unit Form */}
          {(showAddUnit || editingUnit) && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {editingUnit ? 'Редактировать единицу измерения' : 'Добавить единицу измерения'}
              </h3>
              <form onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="например: Штуки"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание (сокращение)
                  </label>
                  <input
                    type="text"
                    value={unitDescription}
                    onChange={(e) => setUnitDescription(e.target.value)}
                    placeholder="например: шт"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelUnitForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingUnit || isUpdatingUnit}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                      isCreatingUnit || isUpdatingUnit ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreatingUnit || isUpdatingUnit ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {showMarkupConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Изменение наценки
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Для товаров без ручной цены пересчёт выполнится автоматически. Отметьте опцию ниже, если нужно
                пересчитать и те товары, у которых цена была изменена вручную (признак «ручная цена» будет снят).
              </p>
              <label className="flex items-start gap-2 text-sm text-gray-800 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateManualPrices}
                  onChange={(e) => setUpdateManualPrices(e.target.checked)}
                  className="mt-1"
                />
                <span>Также изменить цену для товаров, где цена была изменена вручную</span>
              </label>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkupConfirmModal(false);
                    pendingSettingsPayload.current = null;
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMarkupSave}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Подтверждение удаления
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить эту единицу измерения?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeletingUnit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeletingUnit ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
