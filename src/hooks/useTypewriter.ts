import { useEffect, useState } from 'react';

/**
 * Cycles through phrases with a typewriter effect.
 * Returns the current animated string — meant for use as an input placeholder.
 */
export function useTypewriter(
  phrases: string[],
  { typeSpeed = 70, deleteSpeed = 35, pause = 1400 }: { typeSpeed?: number; deleteSpeed?: number; pause?: number } = {}
) {
  const [text, setText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;
    const current = phrases[phraseIdx % phrases.length];

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === '') {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
      return;
    }

    const t = setTimeout(() => {
      setText(prev =>
        deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
      );
    }, deleting ? deleteSpeed : typeSpeed);
    return () => clearTimeout(t);
  }, [text, deleting, phraseIdx, phrases, typeSpeed, deleteSpeed, pause]);

  return text;
}