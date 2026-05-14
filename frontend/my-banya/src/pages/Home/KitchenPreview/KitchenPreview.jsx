import { Utensils, ArrowRight } from 'lucide-react';

function KitchenPreview() {
  const handleClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('kitchen-menu');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const kitchenItems = [
    { name: 'Шашлык', desc: 'Сочный шашлык из отборного мяса на углях, подается с луком и соусом', price: 'от 450 ₽', color: 'from-orange-500/20 to-red-500/20' },
    { name: 'Люля-кебаб', desc: 'Ароматный люля-кебаб с овощами гриль и свежей зеленью', price: 'от 380 ₽', color: 'from-amber-500/20 to-orange-500/20' },
    { name: 'Уха', desc: 'Наваристая уха из свежей рыбы с дымком костра', price: 'от 320 ₽', color: 'from-blue-500/20 to-emerald-500/20' },
  ];

  return (
    <section id="kitchen" className="relative py-24 md:py-32 bg-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-50 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-50 -ml-48 -mb-48" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Utensils size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-zinc-900 mb-6 tracking-tight">
            Кухня в бане
          </h2>
          <p className="text-lg md:text-xl text-zinc-600 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Горячие блюда, приготовленные на дровах. Шашлык, люля-кебаб и традиционные напитки — идеальное завершение банного ритуала.
          </p>
          <a
            href="#kitchen-menu"
            onClick={handleClick}
            className="group inline-flex items-center gap-3 px-10 py-4 bg-zinc-900 text-white rounded-full font-medium transition-all duration-300 hover:bg-zinc-800 hover:shadow-2xl hover:-translate-y-1"
          >
            <span>Смотреть меню</span>
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {/* Превью блюд */}
        <div id="kitchen-menu" className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mt-12">
          {kitchenItems.map((item, index) => (
            <div
              key={index}
              className={`group relative p-8 rounded-3xl border border-zinc-100 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden`}
            >
              {/* Animated background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="mb-6 flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-zinc-900 group-hover:text-black transition-colors">{item.name}</h3>
                  <div className="h-1 w-8 bg-amber-500 rounded-full" />
                </div>
                <p className="text-zinc-600 text-base leading-relaxed mb-8 group-hover:text-zinc-800 transition-colors">
                  {item.desc}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-amber-600 drop-shadow-sm">
                    {item.price}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight size={18} className="text-zinc-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default KitchenPreview;
