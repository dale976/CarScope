import { useState } from 'react';
export interface SavedSearch { id: string; name: string; query: string }
export function useLocalList<T>(key: string, validate: (value: unknown) => value is T) {
  const [items, setItems] = useState<T[]>(() => {
    try { const data: unknown = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(data) ? data.filter(validate) : []; }
    catch { return []; }
  });
  const [error,setError] = useState('');
  function save(next: T[]) {
    setItems(next);
    try { localStorage.setItem(key,JSON.stringify(next)); setError(''); }
    catch { setError('Browser storage is unavailable. Changes will last only for this session.'); }
  }
  return [items,save,error] as const;
}
export const isId = (v: unknown): v is string => typeof v === 'string';
export const isSaved = (v: unknown): v is SavedSearch => !!v && typeof v === 'object' && ['id','name','query'].every(k => typeof (v as Record<string,unknown>)[k] === 'string');
