function Massages() {
  // Статические данные вместо API
  const massages = [
    {
      massage_id: 1,
      name: "Классический расслабляющий",
      description: "Мягкие поглаживания и разминания мышц для снятия стресса и напряжения после тяжёлого дня.",
      price: "1500 ₽"
    },
    {
      massage_id: 2,
      name: "Горячие камни",
      description: "Терапия базальтовыми камнями, прогретыми до оптимальной температуры, для глубокого расслабления и улучшения кровообращения.",
      price: "2200 ₽"
    },
    {
      massage_id: 3,
      name: "Антистресс-массаж головы",
      description: "Нежная техника массажа кожи головы и зоны шеи — идеально дополняет парную и снимает мигрень.",
      price: "900 ₽"
    }
  ];

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-white to-amber-50 min-h-screen mt-28">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">Массаж в бане</h1>
        <p className="text-lg text-gray-600 font-extralight">
          Профессиональный массаж в паре с баней усиливает эффект в разы. 
          Расслабьтесь полностью — тело и дух скажут вам спасибо.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {massages.map((massage) => (
          <div
            key={massage.massage_id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
          >
            <div className="h-2 bg-gradient-to-r from-green-500 to-amber-500"></div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-medium text-gray-800 mb-2">{massage.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                {massage.description}
              </p>

              <div className="mt-auto pt-2">
                <p className="text-lg font-semibold text-gray-800 mb-3">{massage.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Massages;