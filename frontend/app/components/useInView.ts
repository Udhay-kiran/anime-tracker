import { useEffect, useRef, useState, type MutableRefObject } from "react";

type UseInViewOptions = {
  threshold?: number;
  rootMargin?: string;
};

type UseInViewReturn<T extends Element> = {
  ref: MutableRefObject<T | null>;
  inView: boolean;
};

export default function useInView<T extends Element>(
  { threshold = 0.15, rootMargin = "0px 0px -10% 0px" }: UseInViewOptions = {},
): UseInViewReturn<T> {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, inView };
}
