export const YANDEX_METRIKA_ID = 112153346;

/**
 * Цели типа «JavaScript-событие» (Целевое событие) в Яндекс.Метрике.
 * В интерфейсе: Настройки → Цели → Добавить цель → JavaScript-событие → Условие «совпадает».
 * На сайте вызывается: ym(112153346, 'reachGoal', '<идентификатор>', params?)
 */
export const METRIKA_GOALS = {
  BOOKING_HERO: 'btn_booking_hero',
  BOOKING_HEADER: 'btn_booking_header',
  BOOKING_STICKY: 'btn_booking_sticky',
  BOOKING_CONTACTS_SECTION: 'btn_booking_contacts_section',
  BOOKING_CONTACTS_PAGE: 'btn_booking_contacts_page',
  BOOKING_BATH_PAGE: 'btn_booking_bath_page',
  BOOKING_SUCCESS: 'form_booking_success',
  CLICK_PHONE: 'click_phone',
  CLICK_EMAIL: 'click_email',
  NAV_BATHS: 'nav_baths',
  NAV_CONTACTS: 'nav_contacts',
  CLICK_OUR_BATHS: 'click_our_baths',
  CLICK_BATH_DETAIL: 'click_bath_detail',
  CLICK_MAPS: 'click_maps',
};

/** Справочник для настройки целей в интерфейсе Метрики */
export const METRIKA_JS_GOALS_SETUP = [
  {
    id: METRIKA_GOALS.BOOKING_SUCCESS,
    name: 'Заявка отправлена (конверсия)',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_SUCCESS}')`,
    key: true,
  },
  {
    id: METRIKA_GOALS.BOOKING_HERO,
    name: 'Клик «Забронировать» — главный экран',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_HERO}')`,
  },
  {
    id: METRIKA_GOALS.BOOKING_HEADER,
    name: 'Клик «Забронировать» — шапка',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_HEADER}')`,
  },
  {
    id: METRIKA_GOALS.BOOKING_STICKY,
    name: 'Клик «Забронировать» — липкая кнопка',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_STICKY}')`,
  },
  {
    id: METRIKA_GOALS.BOOKING_CONTACTS_SECTION,
    name: 'Клик «Забронировать место» — блок контактов',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_CONTACTS_SECTION}')`,
  },
  {
    id: METRIKA_GOALS.BOOKING_CONTACTS_PAGE,
    name: 'Клик «Забронировать баню» — страница контактов',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_CONTACTS_PAGE}')`,
  },
  {
    id: METRIKA_GOALS.BOOKING_BATH_PAGE,
    name: 'Клик «Забронировать» — страница бани',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.BOOKING_BATH_PAGE}')`,
  },
  {
    id: METRIKA_GOALS.CLICK_PHONE,
    name: 'Клик по телефону',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.CLICK_PHONE}')`,
  },
  {
    id: METRIKA_GOALS.CLICK_EMAIL,
    name: 'Клик по email',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.CLICK_EMAIL}')`,
  },
  {
    id: METRIKA_GOALS.NAV_BATHS,
    name: 'Переход в раздел «Бани»',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.NAV_BATHS}')`,
  },
  {
    id: METRIKA_GOALS.NAV_CONTACTS,
    name: 'Переход в раздел «Контакты»',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.NAV_CONTACTS}')`,
  },
  {
    id: METRIKA_GOALS.CLICK_OUR_BATHS,
    name: 'Клик «Наши бани»',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.CLICK_OUR_BATHS}')`,
  },
  {
    id: METRIKA_GOALS.CLICK_BATH_DETAIL,
    name: 'Клик «Подробнее» о бане',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.CLICK_BATH_DETAIL}')`,
  },
  {
    id: METRIKA_GOALS.CLICK_MAPS,
    name: 'Клик по Яндекс Картам',
    metrikaType: 'JavaScript-событие',
    condition: 'совпадает',
    js: `ym(${YANDEX_METRIKA_ID}, 'reachGoal', '${METRIKA_GOALS.CLICK_MAPS}')`,
  },
];

export function reachMetrikaGoal(goal, params) {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return;
  window.ym(YANDEX_METRIKA_ID, 'reachGoal', goal, params);
}

export function trackMetrikaClick(goal, params) {
  return () => reachMetrikaGoal(goal, params);
}
