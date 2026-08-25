import { Link } from 'react-router-dom';
import { SEO, SITELINKS } from '../../config/seo';

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-white font-medium">{SEO.siteName}</p>
          <p className="text-sm mt-1">
            Бани в Екатеринбурге (ЕКБ), {SEO.address.streetAddress}
          </p>
          <a href={`tel:${SEO.telephone}`} className="text-sm text-green-400 hover:text-green-300 mt-1 inline-block">
            {SEO.telephoneDisplay}
          </a>
        </div>
        <nav aria-label="Быстрые ссылки">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            </li>
            {SITELINKS.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="hover:text-white transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
