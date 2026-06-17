import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGetWebsiteCategoriesPreviewQuery } from '../../redux/slices/apiSlice';

function Header() {
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { data: websiteCategories = [] } = useGetWebsiteCategoriesPreviewQuery();

  // Автоскролл по якорю после перехода на главную (важно для перехода со страниц категорий)
  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;

    const id = location.hash.replace('#', '');
    if (!id) return;

    let cancelled = false;
    let tries = 0;
    const maxTries = 20; // ~2s при 100ms

    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      tries += 1;
      if (tries < maxTries) {
        setTimeout(tryScroll, 100);
      }
    };

    // Делаем скролл после отрисовки
    setTimeout(tryScroll, 0);
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.hash]);

  // Отслеживаем скролл для изменения стиля шапки
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Отслеживаем видимую секцию
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    const categorySectionIds = Array.isArray(websiteCategories)
      ? websiteCategories.map((c) => `site-category-${c.id}`)
      : [];
    const sections = ['baths', ...categorySectionIds, 'booking', 'contacts'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [websiteCategories]);

  // Закрываем мобильное меню при клике на ссылку
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { title: 'Бани', anchor: '#baths', sectionId: 'baths' },
    ...(Array.isArray(websiteCategories)
      ? websiteCategories.map((category) => ({
          title: category.name,
          anchor: `#site-category-${category.id}`,
          sectionId: `site-category-${category.id}`,
        }))
      : []),
    { title: 'Контакты', anchor: '#contacts', sectionId: 'contacts' },
  ];

  const handleClick = (e, anchor) => {
    e.preventDefault();
    const id = anchor.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Если мы не на главной (или секции нет в DOM) — переходим на главную с нужным hash
      if (location.pathname !== '/') {
        navigate(`/${anchor}`);
      } else if (typeof window !== 'undefined') {
        window.location.hash = anchor;
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleBookClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (location.pathname !== '/') {
        navigate('/#booking');
      } else if (typeof window !== 'undefined') {
        window.location.hash = '#booking';
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
            : 'bg-gradient-to-b from-black/50 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Логотип */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img 
                src="/img/Logo.png" 
                alt="Николаевские бани" 
                className={`h-16 md:h-20 transition-all duration-300 ${
                  isScrolled ? 'brightness-100' : 'brightness-110'
                } group-hover:scale-105`} 
              />
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </NavLink>

          {/* Десктопная навигация */}
          <nav className="hidden lg:flex items-center gap-2" aria-label="Основное меню">
            {navLinks.map(({ title, anchor, sectionId, icon }) => (
              <a
                key={title}
                href={anchor}
                onClick={(e) => handleClick(e, anchor)}
                className={`relative px-4 py-2 rounded-xl text-base font-medium transition-all duration-300 group
                  ${activeSection === sectionId 
                    ? isScrolled
                      ? 'text-green-700 bg-green-50'
                      : 'text-white bg-white/20'
                    : isScrolled
                      ? 'text-gray-700 hover:text-green-700 hover:bg-green-50/50'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
              >
                <span>{title}</span>
                {/* Активная линия снизу */}
                {activeSection === sectionId && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-500 rounded-full"></div>
                )}
              </a>
            ))}
            
            {/* CTA Кнопка */}
            <a
              href="#booking"
              onClick={handleBookClick}
              className={`ml-4 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                ${isScrolled
                  ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white text-green-700 hover:bg-green-50 shadow-lg shadow-black/20'
                }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Забронировать
              </span>
            </a>
          </nav>

          {/* Мобильное меню - кнопка */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${
              isScrolled 
                ? 'text-gray-700 hover:bg-gray-100' 
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Открыть меню"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 w-full rounded transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              } ${isScrolled ? 'bg-gray-700' : 'bg-white'}`}></span>
              <span className={`block h-0.5 w-full rounded transition-all duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
              } ${isScrolled ? 'bg-gray-700' : 'bg-white'}`}></span>
              <span className={`block h-0.5 w-full rounded transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              } ${isScrolled ? 'bg-gray-700' : 'bg-white'}`}></span>
            </div>
          </button>
        </div>
      </header>

      {/* Мобильное меню */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <div 
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Заголовок мобильного меню */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Меню</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Закрыть меню"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Навигация */}
          <nav className="flex-1 overflow-y-auto p-6" aria-label="Мобильное меню">
            <div className="space-y-2">
              {navLinks.map(({ title, anchor, sectionId, icon }) => (
                <a
                  key={title}
                  href={anchor}
                  onClick={(e) => handleClick(e, anchor)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300
                    ${activeSection === sectionId 
                      ? 'text-green-700 bg-green-50'
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50/50'
                    }`}
                >
                <span>{title}</span>
                  {activeSection === sectionId && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </a>
              ))}
            </div>
          </nav>

          {/* CTA кнопка внизу */}
          <div className="p-6 border-t border-gray-100">
            <a
              href="#booking"
              onClick={handleBookClick}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Забронировать баню
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
