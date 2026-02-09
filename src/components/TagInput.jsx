import { useState } from 'react';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = (value) => {
    const tag = value.trim().toLowerCase();
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (tags.length >= MAX_TAGS) return;
    if (tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInput('');
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 px-2 py-1.5 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 text-primary-400 hover:text-primary-600"
            >
              &times;
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(',', ''))}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input) addTag(input); }}
            placeholder={tags.length === 0 ? 'e.g. petrol, zomato' : ''}
            maxLength={MAX_TAG_LENGTH}
            className="min-w-[80px] flex-1 border-0 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">{tags.length}/{MAX_TAGS} tags (press Enter or comma to add)</p>
    </div>
  );
}
