import CustomButton from "../../../components/UI/CustomButton/CustomButton";

function MassagesPreview() {
    const handleClick = (e) => {
        e.preventDefault();
        const element = document.getElementById('massages');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div id="massages" className="bg-gray-900 py-20 md:py-28">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 mb-6">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4">
                        Процедуры и массаж
                    </h2>
                    <p className="text-lg text-gray-300 font-extralight max-w-2xl mx-auto mb-8">
                        Профессиональный массаж и банные процедуры для полного расслабления. Разные техники парения для детей и взрослых.
                    </p>
                    <a
                        href="#massages"
                        onClick={handleClick}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                    >
                        <span>Все услуги</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m5-4H3" />
                        </svg>
                    </a>
                </div>

                {/* Превью услуг */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {[
                        { 
                            name: 'Классический массаж', 
                            desc: 'Расслабляющий массаж всего тела для снятия напряжения', 
                            price: 'от 1500 ₽',
                            duration: '60 мин'
                        },
                        { 
                            name: 'Банные процедуры', 
                            desc: 'Профессиональное парение с вениками и ароматерапией', 
                            price: 'от 2000 ₽',
                            duration: '45 мин'
                        },
                        { 
                            name: 'Массаж головы', 
                            desc: 'Антистресс-массаж головы и шейно-воротниковой зоны', 
                            price: 'от 900 ₽',
                            duration: '30 мин'
                        },
                    ].map((item, index) => (
                        <div key={index} className="bg-gray-800 rounded-xl p-6 hover:shadow-md transition-all duration-300 border border-gray-700 group">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-medium text-white">{item.name}</h3>
                                <span className="text-xs px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full font-medium">
                                    {item.duration}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">{item.desc}</p>
                            <p className="text-lg font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                                {item.price}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MassagesPreview;