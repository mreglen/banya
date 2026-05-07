import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetOrganizationQuery } from '../../../redux/slices/apiSlice';

function ContactSection() {
    const navigate = useNavigate();
    const clickCountRef = useRef(0);
    const timerRef = useRef(null);
    const { data: org } = useGetOrganizationQuery();

    const handleIconClick = (e) => {
        // Don't prevent default or stop propagation - keep it invisible
        clickCountRef.current += 1;

        if (clickCountRef.current === 1) {
            // Start timer on first click
            timerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 500); // 500ms window for triple click
        }

        if (clickCountRef.current === 3) {
            // Triple click detected - navigate to admin
            clearTimeout(timerRef.current);
            clickCountRef.current = 0;
            navigate('/admin');
        }
    };

    const handleClick = (e) => {
        e.preventDefault();
        const element = document.getElementById('booking');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section id="contacts" className="bg-gray-900 py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div 
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 mb-6 cursor-pointer"
                        onClick={handleIconClick}
                        style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
                    >
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
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">

                <div className="space-y-8 h-full flex flex-col lg:col-span-4">
                    <div>
                        <h2 className="text-4xl font-light text-white">Свяжитесь с нами</h2>
                        <p className="text-lg text-gray-300 font-extralight mt-3">
                        Мы всегда рады гостям. Забронируйте место или задайте вопрос — ответим в течение 15 минут.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-gray-700 bg-gray-800/40 backdrop-blur-sm p-5">
                            <div className="flex items-start gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <p className="text-base font-semibold text-white">Адрес</p>
                                    <p className="text-gray-300 leading-snug mt-1">
                                        {org?.address
                                            ? org.address.split('\n').map((line, idx) => (
                                                <span key={idx}>
                                                    {line}
                                                    <br />
                                                </span>
                                            ))
                                            : (
                                                <>
                                                    г. Екатеринбург<br />ул. Кизеловская 18
                                                </>
                                            )
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-700 bg-gray-800/40 backdrop-blur-sm p-5">
                            <div className="flex items-start gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.029 21 3 14.971 3 7V5z" />
                                </svg>
                                <div>
                                    <p className="text-base font-semibold text-white">Телефон</p>
                                    <a href="tel:+73433448755" className="text-gray-300 hover:text-green-400 transition mt-1 inline-block">
                                        +7 (343) 344-87-55
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-700 bg-gray-800/40 backdrop-blur-sm p-5">
                            <div className="flex items-start gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-base font-semibold text-white">Email</p>
                                    <a href="mailto:nikolaevskiebani@yandex.ru" className="text-gray-300 hover:text-green-400 transition mt-1 inline-block break-all">
                                        nikolaevskiebani@yandex.ru
                                    </a>
                                </div>
                            </div>
                        </div>

                        {(org?.inn || org?.kpp) && (
                            <div className="rounded-2xl border border-gray-700 bg-gray-800/40 backdrop-blur-sm p-5">
                                <div className="flex items-start gap-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m2 8H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-base font-semibold text-white">Реквизиты</p>
                                        <p className="text-gray-300 leading-snug mt-1">
                                            {org?.inn ? <>ИНН: {org.inn}</> : null}
                                            {org?.inn && org?.kpp ? <><br /></> : null}
                                            {org?.kpp ? <>КПП: {org.kpp}</> : null}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {org?.requisites && (
                            <div className="rounded-2xl border border-gray-700 bg-gray-800/40 backdrop-blur-sm p-5">
                                <div className="flex items-start gap-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                                    </svg>
                                    <div>
                                        <p className="text-base font-semibold text-white">Полные реквизиты</p>
                                        <p className="text-gray-300 leading-snug mt-1 whitespace-pre-line">
                                            {org.requisites}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-auto">
                        <a
                            href="#booking"
                            onClick={handleClick}
                            className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg w-full"
                        >
                            Забронировать место
                        </a>
                    </div>
                </div>

                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-700 h-full min-h-80 md:min-h-96 lg:min-h-[520px] lg:col-span-8">
                    <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
                        <a
                            href="https://yandex.ru/maps/54/yekaterinburg/?utm_medium=mapframe&utm_source=maps"
                            style={{
                                color: '#eee',
                                fontSize: 12,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 1,
                            }}
                        >
                            Екатеринбург
                        </a>
                        <a
                            href="https://yandex.ru/maps/54/yekaterinburg/house/kizelovskaya_ulitsa_18/YkkYcwRpSEYPQFtsfXRzcnVqZQ==/?ll=60.539138%2C56.823991&utm_medium=mapframe&utm_source=maps&z=16.68"
                            style={{
                                color: '#eee',
                                fontSize: 12,
                                position: 'absolute',
                                top: 14,
                                left: 0,
                                zIndex: 1,
                            }}
                        >
                            Кизеловская улица, 18 — Яндекс Карты
                        </a>
                        <iframe
                            src="https://yandex.ru/map-widget/v1/?ll=60.539138%2C56.823991&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NjA3MjY2NBJ20KDQvtGB0YHQuNGPLCDQodCy0LXRgNC00LvQvtCy0YHQutCw0Y8g0L7QsdC70LDRgdGC0YwsINCV0LrQsNGC0LXRgNC40L3QsdGD0YDQsywg0JrQuNC30LXQu9C-0LLRgdC60LDRjyDRg9C70LjRhtCwLCAxOCIKDRQockIVxEtjQg%2C%2C&z=16.68"
                            width="100%"
                            height="120%"
                            frameBorder="1"
                            allowFullScreen
                            title="Карта: г. Екатеринбург, ул. Кизеловская, 18"
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: -110,
                                border: 0,
                            }}
                        />
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}

export default ContactSection;