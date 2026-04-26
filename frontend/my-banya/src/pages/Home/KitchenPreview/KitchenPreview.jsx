import CustomButton from "../../../components/UI/CustomButton/CustomButton";

function KitchenPreview() {
  const handleClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('kitchen-menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="kitchen" className="bg-gray-50 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Кухня в бане
          </h2>
          <p className="text-lg text-gray-600 font-extralight max-w-2xl mx-auto mb-8">
            Горячие блюда, приготовленные на дровах. Шашлык, люля-кебаб, ароматные закуски и традиционные напитки — всё, чтобы вкусно поесть после парной.
          </p>
          <a
            href="#kitchen-menu"
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
          >
            <span>Смотреть меню</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m5-4H3" />
            </svg>
          </a>
        </div>

        {/* Превью блюд */}
        <div id="kitchen-menu" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { name: 'Шашлык', desc: 'Сочный шашлык из отборного мяса на углях', price: 'от 450 ₽' },
            { name: 'Люля-кебаб', desc: 'Ароматный люля-кебаб с овощами гриль', price: 'от 380 ₽' },
            { name: 'Уха', desc: 'Наваристая уха из свежей рыбы', price: 'от 320 ₽' },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
              <h3 className="text-xl font-medium text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.desc}</p>
              <p className="text-lg font-semibold text-amber-600">{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KitchenPreview;