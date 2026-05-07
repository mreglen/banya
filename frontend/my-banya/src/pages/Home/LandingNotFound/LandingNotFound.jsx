import { Link } from 'react-router-dom';

function LandingNotFound() {
  return (
    <main className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
        <p className="text-amber-600 font-semibold text-sm uppercase tracking-wide mb-3">404</p>
        <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">Страница не найдена</h1>
        <p className="text-gray-600 mb-8">
          Похоже, такой страницы на сайте нет или она была перемещена.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors duration-200"
        >
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
}

export default LandingNotFound;
