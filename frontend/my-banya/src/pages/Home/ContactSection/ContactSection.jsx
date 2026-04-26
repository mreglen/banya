import CustomButton from "../../../components/UI/CustomButton/CustomButton";

function ContactSection() {
    const handleClick = (e) => {
        e.preventDefault();
        const element = document.getElementById('booking');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section id="contacts" className="bg-gray-900 py-20 md:py-28">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 mb-6">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4">
                        Контакты
                    </h2>
                    <p className="text-lg text-gray-300 font-extralight max-w-2xl mx-auto">
                        Мы всегда рады гостям. Приезжайте к нам или свяжитесь любым удобным способом.
                    </p>
                </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">


                <div className="space-y-8">
                    <h2 className="text-4xl font-light text-white">Свяжитесь с нами</h2>
                    <p className="text-lg text-gray-300 font-extralight">
                        Мы всегда рады гостям. Забронируйте место или задайте вопрос — ответим в течение 15 минут.
                    </p>


                    <div className="space-y-6 text-gray-300">
                        <div className="flex items-start gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                                <p className="text-lg font-medium text-white">Адрес</p>
                                <p className="text-gray-400">г. Екатеринбург
                                    ул. Кизеловская 18</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.029 21 3 14.971 3 7V5z" />
                            </svg>
                            <div>
                                <p className="text-lg font-medium text-white">Телефон</p>
                                <a href="tel:+73433448755" className="text-gray-400 hover:text-green-400 transition">+7 (343) 344-87-55</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <p className="text-lg font-medium text-white">Email</p>
                                <a href="mailto:info@banavdome.ru" className="text-gray-400 hover:text-green-400 transition">
                                    nikolaevskiebani@yandex.ru
                                </a>
                            </div>
                        </div>
                    </div>


                    <div className="pt-4">
                        <a
                            href="#booking"
                            onClick={handleClick}
                            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                        >
                            Забронировать место
                        </a>
                    </div>
                </div>


                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-700 h-80 md:h-96 lg:h-[500px]">
                    <iframe
                        src="https://yandex.ru/map-widget/v1/?um=constructor%3A7d5a8b4f3e8a7b5d8c6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0&source=constructor"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        title="Местоположение нашей бани"
                        className="border-0"
                    ></iframe>
                </div>
            </div>
            </div>
        </section>
    );
}

export default ContactSection;