import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropPosition, setDropPosition] = useState('bottom');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && selectRef.current && dropdownRef.current) {
      const selectRect = selectRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - selectRect.bottom;
      const spaceAbove = selectRect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropPosition('top');
      } else {
        setDropPosition('bottom');
      }
    }
  }, [isOpen]);

  return (
    <div ref={selectRef} className={`relative group ${className}`}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-left
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50'
          } transition-all duration-300 relative`}
      >
        <span className={`block ${selectedOption ? 'text-white' : 'text-[#777C9D]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#777C9D] group-hover:text-pink2 transition-colors">
          <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: dropPosition === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropPosition === 'bottom' ? -10 : 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full ${
              dropPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
            } py-2 bg-[#2A2A2A] rounded-xl border-2 border-[#3A3A3A] shadow-lg overflow-y-auto custom-scrollbar`}
            style={{
              maxHeight: '144px' // Exactly 3 items: 3 * (40px item height + 8px padding) = 144px
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-[#777C9D] hover:text-white hover:bg-[#3A3A3A] cursor-pointer transition-colors h-10"
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
