import { useGetBathsQuery, useGetOrganizationQuery } from '../../redux/slices/apiSlice';
import CustomButton from '../../components/UI/CustomButton/CustomButton';
import SeoHead from '../../components/Seo/SeoHead';
import { PAGES, absoluteUrl, breadcrumbJsonLd } from '../../config/seo';
import { getPriceRangeLabel, hasTimeTariffs } from '../../utils/bathPricing';
import { METRIKA_GOALS } from '../../utils/yandexMetrika';
import { resolveSitePhone } from '../../utils/sitePhone';

function Baths() {
  const { data: baths = [], isLoading, error } = useGetBathsQuery();
  const { data: org } = useGetOrganizationQuery();
  const phone = resolveSitePhone(org?.phone);
  if (isLoading) {
    return (
      <section className="py-16 px-6 bg-gray-50 min-h-screen mt-16 flex items-center justify-center">
        <p className="text-xl text-gray-700">Загрузка бань...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-6 bg-gray-50 min-h-screen mt-16 text-center">
        <p className="text-red-600 text-lg">Не удалось загрузить бани. Попробуйте позже.</p>
        <p className="text-gray-500 mt-2">{error?.data?.detail || 'Ошибка сети'}</p>
      </section>
    );
  }

  return (
    <main className="py-16 px-6 bg-gray-50 min-h-screen mt-28">
      <SeoHead
        title={PAGES.baths.title}
        description={PAGES.baths.description}
        keywords={PAGES.baths.keywords}
        canonical="/baths"
        jsonLd={[
          breadcrumbJsonLd([
            { name: 'Главная', path: '/' },
            { name: 'Бани', path: '/baths' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Бани в Екатеринбурге — Николаевские бани',
            itemListElement: baths.map((bath, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: bath.name,
              url: absoluteUrl(`/baths/${bath.slug}`),
            })),
          },
        ]}
      />
      <div className="text-center mb-14 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">Бани в Екатеринбурге</h1>
        <p className="text-lg text-gray-600 font-extralight">
          Русские парные на дровах в ЕКБ. Каждая баня — своя атмосфера, температура и ритуал.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {baths.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">Пока нет доступных бань.</p>
        ) : (
          baths.map((bath) => (
            <article
              key={bath.bath_id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col"
            >
              <div className="h-56 md:h-64 w-full relative">
                <img
                  src={bath.image}
                  alt={bath.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div>
                  <h2 className="text-2xl font-light text-gray-800 mb-1">{bath.name}</h2>
                  <p className="text-green-600 text-sm font-medium mb-3">{bath.title}</p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">
                      {hasTimeTariffs(bath) ? (
                        <>
                          <span className="font-medium text-gray-700">{getPriceRangeLabel(bath, 'weekday')}₽</span>/час (пн-чт)
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">{bath.cost_weekday}₽</span>/час (пн-чт)
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {hasTimeTariffs(bath) ? (
                        <>
                          <span className="font-medium text-gray-700">{getPriceRangeLabel(bath, 'weekend')}₽</span>/час (пт-вс)
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">{bath.cost_weekend}₽</span>/час (пт-вс)
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Доп. гость:{' '}
                    <span className="font-medium text-gray-700">{bath.extra_guest_price}₽</span>/час
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {bath.description && bath.description.length > 150
                      ? `${bath.description.slice(0, 150)}...`
                      : bath.description || 'Русская баня на дровах'}
                  </p>
                </div>

                <div className="mt-auto">
                  <CustomButton
                    to={`/baths/${bath.slug}`}
                    text="Подробнее"
                    variant="green"
                    metrikaGoal={METRIKA_GOALS.CLICK_BATH_DETAIL}
                    metrikaParams={{ bath_slug: bath.slug, bath_name: bath.name, source: 'baths_list' }}
                    className="w-full py-3 text-sm hover:shadow-md transition"
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="text-center mt-16">
        <p className="text-gray-600 mb-6">Не можете выбрать? Позвоните — поможем подобрать!</p>
        <a
          href={phone.telHref}
          className="text-green-600 hover:text-green-700 font-medium text-lg transition"
        >
          {phone.display}
        </a>
      </div>
    </main>
  );
}

export default Baths;