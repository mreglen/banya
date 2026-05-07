import { Link } from 'react-router-dom';

function AdminNotFound() {
  return (
    <section className="p-6 md:p-10">
      <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 md:p-10 text-center shadow-sm">
        <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wide mb-3">404</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
          Страница админ-панели не найдена
        </h1>
        <p className="text-gray-600 mb-8">
          Проверьте адрес или вернитесь в основной раздел админ-панели.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors duration-200"
        >
          Перейти в админ-панель
        </Link>
      </div>
    </section>
  );
}

export default AdminNotFound;
