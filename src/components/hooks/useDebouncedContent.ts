import { useEffect, useState } from 'react';

export const useDebouncedContent = (content: string, delay: number) => {
  const [value, setValue] = useState(content);

  useEffect(() => {
    if (delay <= 0) {
      setValue(content);
      return;
    }
    const t = setTimeout(() => setValue(content), delay);
    return () => clearTimeout(t);
  }, [content, delay]);

  return value;
};
