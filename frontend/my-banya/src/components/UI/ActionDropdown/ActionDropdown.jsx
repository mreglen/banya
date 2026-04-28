// src/components/UI/ActionDropdown/ActionDropdown.jsx
import { useState, useRef, useEffect } from 'react';

/**
 * ActionDropdown component - Reusable dropdown menu for table actions
 * 
 * @param {Array} actions - Array of action objects:
 *   - label: string (button text)
 *   - onClick: function (action handler)
 *   - icon: string (optional emoji/icon)
 *   - color: string (optional: 'green', 'red', 'blue', 'yellow', etc.)
 *   - disabled: boolean (optional)
 * @param {string} buttonText - Text for the main button (default: "Действия")
 */
function ActionDropdown({ actions, buttonText = 'Действия' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('down');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setPosition('up');
      } else {
        setPosition('down');
      }
    }
  }, [isOpen]);

  const handleAction = (action) => {
    if (action.disabled) return;
    action.onClick();
    setIsOpen(false);
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'text-green-600 hover:bg-green-50',
      red: 'text-red-600 hover:bg-red-50',
      blue: 'text-blue-600 hover:bg-blue-50',
      yellow: 'text-yellow-600 hover:bg-yellow-50',
      purple: 'text-purple-600 hover:bg-purple-50',
      gray: 'text-gray-600 hover:bg-gray-50',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Main button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-300"
      >
        <span>{buttonText}</span>
        <svg
          className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu - appears above all content */}
      {isOpen && (
        <div 
          className={`absolute right-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-[9999] ${
            position === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action);
              }}
              disabled={action.disabled}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition ${
                action.disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : getColorClasses(action.color)
              }`}
            >
              {action.icon && <span className="text-base">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionDropdown;
