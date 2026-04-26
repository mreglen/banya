import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';

const CustomButton = ({ to, text, variant = 'brown' }) => {

  const bgColor =
    variant === 'green'
      ? 'bg-green_primary-middle hover:bg-green-500'
      : 'bg-brown_primary-dark hover:bg-brown_primary-middle';

  return (
    <NavLink
      to={to}
      className={`${bgColor} p-2 w-48 text-center text-white text-xl font-extralight rounded-sm transition-colors duration-500 ease-out`}
    >
      {text}
    </NavLink>
  );
};


CustomButton.propTypes = {
  to: PropTypes.string.isRequired,
  text: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['brown', 'green']),
};

export default CustomButton;