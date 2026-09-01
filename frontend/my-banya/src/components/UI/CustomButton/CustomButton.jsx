import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { reachMetrikaGoal } from '../../../utils/yandexMetrika';

const variantClasses = {
  green: 'bg-green_primary-middle hover:bg-green-500 text-white',
  brown: 'bg-brown_primary-dark hover:bg-brown_primary-middle text-white',
  outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100',
};

const CustomButton = ({
  to,
  text,
  variant = 'brown',
  className = '',
  metrikaGoal,
  metrikaParams,
  onClick,
}) => {
  const variantClass = variantClasses[variant] || variantClasses.brown;

  return (
    <NavLink
      to={to}
      onClick={(e) => {
        if (metrikaGoal) {
          reachMetrikaGoal(metrikaGoal, metrikaParams);
        }
        onClick?.(e);
      }}
      className={`${variantClass} p-2 w-48 text-center text-xl font-extralight rounded-xl transition-colors duration-500 ease-out ${className}`}
    >
      {text}
    </NavLink>
  );
};

CustomButton.propTypes = {
  to: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['brown', 'green', 'outline']),
  className: PropTypes.string,
  metrikaGoal: PropTypes.string,
  metrikaParams: PropTypes.object,
  onClick: PropTypes.func,
};

export default CustomButton;
