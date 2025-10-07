import CustomButton from "../../../components/UI/CustomButton/CustomButton";

function KitchenPreview() {
  return (
    <div 
      className="relative w-full bg-gradient-to-br from-brown_primary-dark via-amber-900 to-amber-800 text-white text-center py-20 px-6 overflow-hidden"

    >
      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-wide">
          Кухня в бане
        </h1>
        <p className="text-2xl sm:text-3xl font-extralight text-amber-100 leading-relaxed">
          Горячие блюда, приготовленные на дровах
        </p>
        <p className="text-lg sm:text-xl font-light text-amber-200 max-w-2xl mx-auto">
          Шашлык, люля-кебаб, ароматные закуски и традиционные напитки — 
          всё, чтобы вкусно поесть после парной.
        </p>
        <div className="mt-8">
          <CustomButton
            to="/kitchen"
            text="Подробнее о меню"
            variant="green"
            
          />
        </div>
      </div>
    </div>
  );
}

export default KitchenPreview;