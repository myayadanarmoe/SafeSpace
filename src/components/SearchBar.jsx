import React, { useState, useEffect } from 'react';

export default function SearchBar({ onSearch }) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue, onSearch]);

  return (
    <input
      type="text"
      placeholder="Search users by username, email or role..."
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
    />
  );
}