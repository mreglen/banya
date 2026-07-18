import { Sparkles, Clock, ArrowRight } from 'lucide-react';

function MassagesPreview() {
    const handleClick = (e) => {
        e.preventDefault();
        const element = document.getElementById('massages');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const massageItems = [
        { 
            name: 'Классический массаж', 
            desc: 'Расслабляющий массаж всего тела для снятия мышечного напряжения и улучшения кровообращения', 
            price: 'от 1500 ₽',
            duration: '60 мин',
            icon: 'bg-purple-500/10 text-purple-400'
        },
        { 
            name: 'Банные процедуры', 
            desc: 'Профессиональное парение с дубовыми вениками, солевым пилингом и ароматерапией', 
            price: 'от 2000 ₽',
            duration: '45 мин',
            icon: 'bg-emerald-500/10 text-emerald-400'
        },
        { 
            name: 'Массаж головы', 
            desc: 'Антистресс-массаж головы и шейно-воротниковой зоны для снятия усталости', 
            price: 'от 900 ₽',
            duration: '30 мин',
            icon: 'bg-blue-500/10 text-blue-400'
        },
    ];

    return (
        <section id="massages" className="relative py-24 md:py-32 bg-zinc-950 overflow-x-clip">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 mb-8 shadow-2xl">
                        <Sparkles size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 tracking-tight">
                        Процедуры и массаж
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                        Профессиональный массаж и банные ритуалы для восстановления сил. Позвольте себе момент истинного блаженства.
                    </p>
                    <a
                        href="#massages"
                        onClick={handleClick}
                        className="group inline-flex items-center gap-3 px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:-translate-y-1"
                    >
                        <span>Все услуги</span>
                        <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                </div>

                {/* Превью услуг */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mt-12">
                    {massageItems.map((item, index) => (
                        <div 
                            key={index} 
                            className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:bg-zinc-900"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className={`p-3 rounded-xl ${item.icon} transition-transform duration-500 group-hover:scale-110`}>
                                    <Clock size={24} />
                                </div>
                                <span className="text-xs px-4 py-1.5 bg-zinc-800 text-zinc-300 rounded-full font-medium tracking-wider uppercase">
                                    {item.duration}
                                </span>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                                {item.name}
                            </h3>
                            <p className="text-zinc-400 text-base leading-relaxed mb-8 font-light">
                                {item.desc}
                            </p>
                            
                            <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
                                <span className="text-2xl font-black text-white">
                                    {item.price}
                                </span>
                                <div className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ArrowRight size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default MassagesPreview;