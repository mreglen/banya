import CustomButton from "../../components/UI/CustomButton/CustomButton";
import SeoHead from '../../components/Seo/SeoHead';
import SEO, { absoluteUrl } from '../../config/seo';

function Contacts() {
  return (
    <main className="bg-gradient-to-b from-white via-green-50 to-amber-50 min-h-screen mt-28">
      <SeoHead
        title="Контакты - Николаевские бани в Екатеринбурге"
        description="Контакты Николаевских бань в Екатеринбурге. Адрес: ул. Кизеловская, 18. Телефон: +7 (343) 344-87-55. Бронирование бань онлайн."
        keywords="Николаевские бани контакты, адрес бани Екатеринбург, телефон бани, как добраться"
        canonical="/contacts"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: SEO.siteName,
          url: absoluteUrl('/'),
          telephone: SEO.telephone,
          email: SEO.email,
          address: {
            '@type': 'PostalAddress',
            streetAddress: SEO.address.streetAddress,
            addressLocality: SEO.address.addressLocality,
            addressCountry: SEO.address.addressCountry,
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: SEO.geo.latitude,
            longitude: SEO.geo.longitude,
          },
        }}
      />

      <div className="py-16 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">Контакты</h1>
        <p className="text-lg text-gray-600 font-extralight">
          Мы всегда рады гостям. Приезжайте к нам — баня ждёт вас в любое время года.
        </p>
      </div>


      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 pb-20">

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col">
          <div className="p-8 flex-1 flex flex-col">
            <h2 className="text-2xl font-medium text-gray-800 mb-6">Информация</h2>

            <div className="space-y-6 text-gray-700">

              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="font-medium">Адрес</p>
                  <p className="text-gray-500">г. Екатеринбург<br />ул. Кизеловская, 18</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.029 21 3 14.971 3 7V5z" />
                </svg>
                <div>
                  <p className="font-medium">Телефон</p>
                  <a href="tel:+73433448755" className="text-gray-500 hover:text-green-600 transition-colors">
                    +7 (343) 344-87-55
                  </a>
                </div>
              </div>


              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:nikolaevskiebani@yandex.ru" className="text-gray-500 hover:text-green-600 transition-colors">
                    nikolaevskiebani@yandex.ru
                  </a>
                </div>
              </div>
            </div>


            <div className="mt-auto pt-8">
              <CustomButton
                to="/booking"
                text="Забронировать баню"
                variant="green"
                className="w-full py-3 text-lg hover:shadow-lg transition-all"
              />
            </div>
          </div>
        </div>


        <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-200 flex">
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <a
              href="https://yandex.ru/maps/54/yekaterinburg/?utm_medium=mapframe&utm_source=maps"
              style={{
                color: '#eee',
                fontSize: '12px',
                position: 'absolute',
                top: '0px',
                left: 0,
                zIndex: 2,
              }}
            >
              Екатеринбург
            </a>
            <a
              href="https://yandex.ru/maps/54/yekaterinburg/house/kizelovskaya_ulitsa_18/YkkYcwRpSEYPQFtsfXRzcnVqZQ==/?ll=60.539138%2C56.823991&utm_medium=mapframe&utm_source=maps&z=16"
              style={{
                color: '#eee',
                fontSize: '12px',
                position: 'absolute',
                top: '14px',
                left: 0,
                zIndex: 2,
              }}
            >
              Кизеловская улица, 18 — Яндекс Карты
            </a>
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=60.539138%2C56.823991&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NjA3OTYyMjY0NBJ20KDQvtGB0YHQuNGPLCDQodCy0LXRgNC00LvQvtCy0YHQutCw0Y8g0L7QsdC70LDRgdGC0YwsINCV0LrQsNGC0LXRgNC40L3QsdGD0YDQsywg0JrQuNC30LXQu9C-0LLRgdC60LDRjyDRg9C70LjRhtCwLCAxOCIKDRQockIVxEtjQg%2C%2C&z=16"
              width="560"
              height="400"
              frameBorder="1"
              allowFullScreen={true}
              style={{ position: 'relative', width: '100%', height: '400px', border: 0, zIndex: 1 }}
              title="Местоположение по адресу: Кизеловская улица, 18 (Екатеринбург)"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Contacts;