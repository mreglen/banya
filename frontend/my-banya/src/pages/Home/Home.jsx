import ListBaths from "./ListBaths/ListBaths";
import KitchenPreview from "./KitchenPreview/KitchenPreview";
import MassagesPreview from "./MassagesPreview/MassagesPreview";
import Booking from "../Booking/Booking";
import ContactSection from "./ContactSection/ContactSection";


function Home() {
    return (
        <div>
            <div
                className="relative w-full min-h-screen flex items-center bg-cover bg-center bg-no-repeat bg-fixed"
                style={{
                    backgroundImage: "url('/img/bg-home.png')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>

                <div className="relative z-10 w-full px-6 py-32 md:py-0">
                    <div className="max-w-5xl mx-auto text-center text-white">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-6 md:mb-8 leading-tight">
                            Николаевские бани
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extralight mb-8 md:mb-12 leading-relaxed max-w-3xl mx-auto">
                            Это атмосфера настоящей русской бани на дровах с вековыми традициями. Мы восстанавливаем силы и душевное тепло.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="#booking"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 transform hover:scale-105"
                            >
                                Забронировать
                            </a>
                            <a
                                href="#baths"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('baths')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium text-lg border border-white/30 transition-all duration-300"
                            >
                                Наши бани
                            </a>
                        </div>
                    </div>
                </div>

                {/* Индикатор скролла */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            <ListBaths />
            <KitchenPreview />
            <MassagesPreview />
            <Booking />
            <ContactSection />
        </div>
    );
}

export default Home;