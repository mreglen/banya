import { NavLink } from 'react-router-dom';

function Header() {
  const navLinks = [
    ['Главная', '/'],
    ['Бани', '/baths'],
    ['Кухня', '/kitchen'],
    ['Массаж', '/massages'],
    ['Контакты', '/contact']
  ];

  return (
    <header 
      className="
        fixed top-0 left-0 w-full 
        flex justify-around items-center 
        bg-white bg-opacity-90 
        z-50  
      "
    >
      <NavLink to="/">
        <img src="/img/Logo.png" alt="Логотип" className="" />
      </NavLink>

      <nav className="flex gap-16">
        {navLinks.map(([title, url]) => (
          <NavLink
            key={title}
            to={url}
            className={({ isActive }) =>
              `text-lg font-medium transition-colors duration-300 
              ${isActive 
                ? 'text-[#803613] font-semibold' 
                : 'text-black hover:text-gray-700'
              }`
            }
          >
            {title}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Header;