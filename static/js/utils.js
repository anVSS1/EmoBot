// Utility functions for DOM manipulation and common operations
function createElement(tag, className, attributes = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  return element;
}

function createIcon(name, className = '') {
  const icon = createElement('i', className);
  icon.setAttribute('data-lucide', name);
  return icon;
}

// Export utilities
window.utils = {
  createElement,
  createIcon
};