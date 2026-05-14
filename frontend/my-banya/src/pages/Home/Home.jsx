import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import ListBaths from "./ListBaths/ListBaths";
import WebsiteCategoriesPreview from "./WebsiteCategoriesPreview/WebsiteCategoriesPreview";
import Booking from "../Booking/Booking";
import ContactSection from "./ContactSection/ContactSection";
import { useReveal } from '../../hooks/useReveal';
import { Calendar } from 'lucide-react';

function Home() {
    useReveal();
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowSticky(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToBooking = (e) => {
        e?.preventDefault();
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="overflow-x-hidden">
            <Helmet>
                <title>Николаевские бани - Русские бани на дровах в Екатеринбурге</title>
                <meta name="description" content="Николаевские бани в Екатеринбурге - настоящие русские бани на дровах с вековыми традициями. Бронирование онлайн, парение с вениками, отдых для души и тела." />
                <meta name="keywords" content="бани Екатеринбург, русская баня, баня на дровах, парение, веники, отдых, Николаевские бани, бронирование бани" />

                {/* Open Graph */}
                <meta property="og:title" content="Николаевские бани - Русские бани на дровах в Екатеринбурге" />
                <meta property="og:description" content="Настоящие русские бани на дровах с вековыми традициями. Восстанавливаем силы и душевное тепло." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://nikolaevskie-bani.ru/" />
                <meta property="og:image" content="%PUBLIC_URL%/img/Logo.png" />
                <meta property="og:locale" content="ru_RU" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Николаевские бани - Русские бани на дровах в Екатеринбурге" />
                <meta name="twitter:description" content="Настоящие русские бани на дровах с вековыми традициями." />

                {/* Schema.org structured data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "LocalBusiness",
                        "name": "Николаевские бани",
                        "description": "Настоящие русские бани на дровах с вековыми традициями",
                        "url": "https://nikolaevskie-bani.ru/",
                        "telephone": "+73433448755",
                        "email": "nikolaevskiebani@yandex.ru",
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": "ул. Кизеловская, 18",
                            "addressLocality": "Екатеринбург",
                            "addressCountry": "RU"
                        },
                        "priceRange": "₽₽"
                    })}
                </script>
            </Helmet>
            <div
                className="relative w-full min-h-[100svh] flex items-center bg-cover bg-no-repeat bg-[center_top] sm:bg-center bg-scroll md:bg-fixed"
                style={{
                    backgroundImage: "url('/img/bg-home.png')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"></div>

                <div className="relative z-10 w-full px-6 py-24 sm:py-32 md:py-0">
                    <div className="max-w-5xl mx-auto text-center text-white">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-6 md:mb-8 leading-tight drop-shadow-2xl">
                            Николаевские бани
                        </h1>
                        <p className="text-xl sm:text-2xl md:text-3xl font-light mb-10 md:mb-14 leading-relaxed max-w-3xl mx-auto text-white/90">
                            Атмосфера настоящей русской бани на дровах с вековыми традициями. Мы восстанавливаем силы и душевное тепло.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <a
                                href="#booking"
                                onClick={scrollToBooking}
                                className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(22,163,74,0.4)] transform hover:scale-105"
                            >
                                Забронировать
                            </a>
                            <a
                                href="#baths"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('baths')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl font-semibold text-xl border border-white/20 transition-all duration-300"
                            >
                                Наши бани
                            </a>
                        </div>
                    </div>
                </div>

                {/* Индикатор скролла */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <button
                        type="button"
                        onClick={() => document.getElementById('baths')?.scrollIntoView({ behavior: 'smooth' })}
                        className="animate-bounce p-2 rounded-full hover:bg-white/10 transition group"
                        aria-label="Перейти к слайдеру бань"
                    >
                        <svg className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="reveal"><ListBaths /></div>
            <div className="reveal"><WebsiteCategoriesPreview /></div>
            <div className="reveal"><Booking /></div>
            <div className="reveal"><ContactSection /></div>

            {/* Sticky Booking Button for Mobile */}
            <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${showSticky ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <button
                    onClick={scrollToBooking}
                    className="flex items-center gap-3 px-6 py-4 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95"
                >
                    <Calendar size={24} />
                    <span className="font-bold text-lg hidden sm:inline">Забронировать</span>
                </button>
            </div>
        </div>
    );
}

export default Home;