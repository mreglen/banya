import SliderBaths from './SliderBaths/SliderBaths';



function ListBaths() {
    return (
        <div id="baths" className="bg-gray-900 py-20 md:py-28">
            <div className='max-w-6xl mx-auto px-6'>
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 mb-6">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4">
                        Наши бани
                    </h2>
                    <p className="text-lg text-gray-300 font-extralight max-w-2xl mx-auto">
                        Выберите идеальную баню для отдыха с друзьями и семьёй. Каждая баня уникальна и оборудована всем необходимым.
                    </p>
                </div>
                <SliderBaths />
            </div>
        </div>
    );
}

export default ListBaths;