import { useState, useEffect } from 'react';

export function useShortlist() {
  const [shortlist, setShortlist] = useState(() => {
    try {
      const saved = localStorage.getItem('gft-shortlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('gft-shortlist', JSON.stringify(shortlist));
  }, [shortlist]);

  const addToShortlist = (playerId) => {
    setShortlist(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
  };

  const removeFromShortlist = (playerId) => {
    setShortlist(prev => prev.filter(id => id !== playerId));
  };

  const isInShortlist = (playerId) => shortlist.includes(playerId);

  const clearShortlist = () => setShortlist([]);

  return { shortlist, addToShortlist, removeFromShortlist, isInShortlist, clearShortlist };
}
