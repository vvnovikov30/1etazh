"use client";

import { useEffect, useRef, useState, type ReactNode, useMemo, useCallback } from "react";
import { shuffleWithSeed, getOrCreateSeed } from "@/lib/shuffle";

type CarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  itemClassName?: string;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  showArrows?: boolean;
  showProgress?: boolean;
  ariaLabel?: string;
  onItemClick?: (item: T, index: number) => void;
  shuffleSeedKey?: string;
  infinite?: boolean;
  enable3D?: boolean; // 3D эффект для ShowroomCarousel
};

export function Carousel<T>({
  items,
  renderItem,
  className = "",
  itemClassName = "",
  autoScroll = false,
  autoScrollInterval = 7000,
  showArrows = true,
  showProgress = true,
  ariaLabel = "Карусель",
  onItemClick,
  shuffleSeedKey,
  infinite = false,
  enable3D = false,
}: CarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(1); // Стартовый индекс для infinite = 1
  const currentIndexRef = useRef(1); // Ref для отслеживания текущего индекса
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const pointerCurrentXRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<number>(0);
  const itemWidthRef = useRef<number>(0);
  const gapRef = useRef<number>(16); // gap-4 = 16px
  const isInitializedRef = useRef<boolean>(false);

  // Рандомизация и создание extendedItems для infinite loop
  const { processedItems, extendedItems, originalLength } = useMemo(() => {
    if (items.length === 0) {
      return { processedItems: [], extendedItems: [], originalLength: 0 };
    }

    let processed = [...items];

    if (shuffleSeedKey && typeof window !== "undefined") {
      const seed = getOrCreateSeed(shuffleSeedKey);
      processed = shuffleWithSeed(processed, seed);
    }

    const originalLength = processed.length;

    let extended: T[] = [];
    if (infinite && processed.length > 0) {
      const first = processed[0];
      const last = processed[processed.length - 1];
      extended = [last, ...processed, first];
    } else {
      extended = processed;
    }

    return {
      processedItems: processed,
      extendedItems: extended,
      originalLength,
    };
  }, [items, shuffleSeedKey, infinite]);

  // Проверка prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Инициализация: вычисляем ширину элемента
  useEffect(() => {
    if (!trackRef.current || extendedItems.length === 0) return;

    const updateItemWidth = () => {
      const track = trackRef.current;
      if (!track) return;

      const firstItem = track.children[0] as HTMLElement;
      if (firstItem) {
        itemWidthRef.current = firstItem.offsetWidth;
      }
    };

    const timeoutId = setTimeout(() => {
      updateItemWidth();
      if (infinite) {
        setCurrentIndex(1); // Стартовый индекс для infinite = 1
      } else {
        setCurrentIndex(0);
      }
      isInitializedRef.current = true;
    }, 0);

    const handleResize = () => {
      updateItemWidth();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [extendedItems.length, infinite]);

  // Синхронизация currentIndexRef с currentIndex
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Обработка jump для infinite карусели после завершения анимации через transitionend
  useEffect(() => {
    if (!infinite || !isInitializedRef.current || !trackRef.current) return;
    
    const track = trackRef.current;
    const lastIndex = extendedItems.length - 1;
    
    const handleTransitionEnd = (e: TransitionEvent) => {
      // Проверяем, что это событие относится к transform
      if (e.propertyName !== "transform") return;
      
      // Используем ref для получения актуального значения индекса
      const currentIdx = currentIndexRef.current;
      
      // Проверяем, нужно ли делать jump
      if (currentIdx === lastIndex) {
        // Мы на клоне first → прыгаем на index = 1 (мгновенно, без анимации)
        setIsTransitioning(true);
        requestAnimationFrame(() => {
          setCurrentIndex(1);
          dragOffsetRef.current = 0;
          setIsTransitioning(false);
        });
      } else if (currentIdx === 0) {
        // Мы на клоне last → прыгаем на index = originalLength (мгновенно, без анимации)
        setIsTransitioning(true);
        requestAnimationFrame(() => {
          setCurrentIndex(originalLength);
          dragOffsetRef.current = 0;
          setIsTransitioning(false);
        });
      }
    };
    
    track.addEventListener("transitionend", handleTransitionEnd);
    
    return () => {
      track.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [infinite, extendedItems.length, originalLength]);

  // Вычисляем translateX для позиционирования
  const getTranslateX = useCallback(() => {
    if (itemWidthRef.current === 0) return 0;
    const itemWidth = itemWidthRef.current;
    const gap = gapRef.current;
    const totalWidth = itemWidth + gap;
    
    if (infinite) {
      // Для infinite: currentIndex уже в extendedItems координатах
      const centerOffset = containerRef.current 
        ? containerRef.current.offsetWidth / 2 
        : 0;
      return centerOffset - (currentIndex * totalWidth + itemWidth / 2) + dragOffsetRef.current;
    } else {
      const centerOffset = containerRef.current 
        ? containerRef.current.offsetWidth / 2 
        : 0;
      return centerOffset - (currentIndex * totalWidth + itemWidth / 2) + dragOffsetRef.current;
    }
  }, [currentIndex, infinite]);

  // Переход к следующему индексу
  const goToIndex = useCallback((targetIndex: number, smooth = true) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(targetIndex);
    dragOffsetRef.current = 0;
    
    if (smooth && !prefersReducedMotion) {
      setTimeout(() => {
        setIsTransitioning(false);
        // Jump обрабатывается через transitionend в useEffect
      }, 500);
    } else {
      setIsTransitioning(false);
      
      // Для мгновенного перехода также проверяем jump сразу
      if (infinite && isInitializedRef.current) {
        const lastIndex = extendedItems.length - 1;
        
        if (targetIndex === lastIndex) {
          setCurrentIndex(1);
          dragOffsetRef.current = 0;
        } else if (targetIndex === 0) {
          setCurrentIndex(originalLength);
          dragOffsetRef.current = 0;
        }
      }
    }
  }, [prefersReducedMotion, isTransitioning, infinite, extendedItems.length, originalLength]);

  // Переход к следующему
  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsInteracting(true);

    if (infinite) {
      const nextIndex = currentIndex + 1;
      goToIndex(nextIndex);
    } else {
      const nextIndex = (currentIndex + 1) % originalLength;
      goToIndex(nextIndex);
    }

    setTimeout(() => setIsInteracting(false), 1000);
  }, [currentIndex, infinite, originalLength, goToIndex, isTransitioning]);

  // Переход к предыдущему
  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsInteracting(true);

    if (infinite) {
      const prevIndex = currentIndex - 1;
      goToIndex(prevIndex);
    } else {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : originalLength - 1;
      goToIndex(prevIndex);
    }

    setTimeout(() => setIsInteracting(false), 1000);
  }, [currentIndex, infinite, originalLength, goToIndex, isTransitioning]);

  // Внутренняя функция для autoplay
  const scrollNext = useCallback((skipInteraction = false) => {
    if (isTransitioning) return;
    
    if (!skipInteraction) {
      setIsInteracting(true);
    }

    if (infinite) {
      const nextIndex = currentIndex + 1;
      goToIndex(nextIndex);
    } else {
      const nextIndex = (currentIndex + 1) % originalLength;
      goToIndex(nextIndex);
    }

    if (!skipInteraction) {
      setTimeout(() => setIsInteracting(false), 1000);
    }
  }, [currentIndex, infinite, originalLength, goToIndex, isTransitioning]);

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  // Обработка свайпа (touch events для мобильных)
  // Используем только на мобильных устройствах, чтобы избежать конфликта с pointer events
  const handleTouchStart = (e: React.TouchEvent) => {
    // Игнорируем если уже обрабатывается pointer event
    if (isPointerDownRef.current) return;
    
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchCurrentXRef.current = e.touches[0].clientX;
    setIsInteracting(true);
    dragOffsetRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Игнорируем если уже обрабатывается pointer event
    if (isPointerDownRef.current) return;
    
    if (touchStartXRef.current === null || touchStartYRef.current === null || !trackRef.current) return;
    
    touchCurrentXRef.current = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const diffX = touchStartXRef.current - touchCurrentXRef.current;
    const diffY = touchStartYRef.current - currentY;
    
    // Если свайп горизонтальный (больше чем вертикальный), обрабатываем его
    const horizontalDiff = Math.abs(diffX);
    const verticalDiff = Math.abs(diffY);
    
    if (horizontalDiff > verticalDiff && horizontalDiff > 10) {
      // Предотвращаем скролл страницы только для горизонтального свайпа
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Всегда обновляем позицию для визуальной обратной связи при горизонтальном движении
    if (horizontalDiff > 5) {
      dragOffsetRef.current = -diffX; // Инвертируем для правильного направления
      
      // Обновляем transform напрямую для визуальной обратной связи
      const itemWidth = itemWidthRef.current || 0;
      const gap = gapRef.current;
      const totalWidth = itemWidth + gap;
      const centerOffset = containerRef.current 
        ? containerRef.current.offsetWidth / 2 
        : 0;
      const baseTranslateX = centerOffset - (currentIndex * totalWidth + itemWidth / 2);
      const currentTranslateX = baseTranslateX + dragOffsetRef.current;
      
      trackRef.current.style.transform = `translateX(${currentTranslateX}px)`;
      trackRef.current.style.transition = "none";
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Игнорируем если уже обрабатывается pointer event
    if (isPointerDownRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchCurrentXRef.current = null;
      return;
    }
    
    if (touchStartXRef.current === null || touchCurrentXRef.current === null) {
      setIsInteracting(false);
      dragOffsetRef.current = 0;
      if (trackRef.current) {
        trackRef.current.style.transition = "";
      }
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      touchCurrentXRef.current = null;
      return;
    }

    const diff = touchStartXRef.current - touchCurrentXRef.current;
    const threshold = 50; // Порог 50px

    // Восстанавливаем transition
    if (trackRef.current) {
      trackRef.current.style.transition = "";
    }

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Свайп вправо → следующий
        handleNext();
      } else {
        // Свайп влево → предыдущий
        handlePrev();
      }
    } else {
      // Недостаточный свайп → возвращаемся к текущему индексу
      dragOffsetRef.current = 0;
      goToIndex(currentIndex, true);
    }

    setTimeout(() => setIsInteracting(false), 1000);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchCurrentXRef.current = null;
  };

  // Обработка pointer events (для тачпада и мыши)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Игнорируем если это не основная кнопка мыши или touch
    if (e.pointerType === "mouse" && e.button !== 0) return;
    
    // Для тачпада (pointerType = "mouse" но без реального клика) обрабатываем по-другому
    // Но пока обрабатываем все pointer events одинаково
    
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    pointerCurrentXRef.current = e.clientX;
    isPointerDownRef.current = true;
    setIsInteracting(true);
    dragOffsetRef.current = 0;
    
    // Устанавливаем capture для отслеживания движения вне элемента
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || pointerStartXRef.current === null || pointerStartYRef.current === null || !trackRef.current) return;
    
    pointerCurrentXRef.current = e.clientX;
    const currentY = e.clientY;
    
    const diffX = pointerStartXRef.current - pointerCurrentXRef.current;
    const diffY = pointerStartYRef.current - currentY;
    
    // Если свайп горизонтальный (больше чем вертикальный), обрабатываем его
    const horizontalDiff = Math.abs(diffX);
    const verticalDiff = Math.abs(diffY);
    
    // Обновляем позицию для визуальной обратной связи при горизонтальном движении
    if (horizontalDiff > 5) {
      dragOffsetRef.current = -diffX; // Инвертируем для правильного направления
      
      // Обновляем transform напрямую для визуальной обратной связи
      const itemWidth = itemWidthRef.current || 0;
      const gap = gapRef.current;
      const totalWidth = itemWidth + gap;
      const centerOffset = containerRef.current 
        ? containerRef.current.offsetWidth / 2 
        : 0;
      const baseTranslateX = centerOffset - (currentIndex * totalWidth + itemWidth / 2);
      const currentTranslateX = baseTranslateX + dragOffsetRef.current;
      
      trackRef.current.style.transform = `translateX(${currentTranslateX}px)`;
      trackRef.current.style.transition = "none";
      
      // Предотвращаем скролл страницы только если горизонтальное движение значительное
      // И только если это действительно горизонтальный свайп (не вертикальный скролл)
      if (horizontalDiff > verticalDiff * 1.5 && horizontalDiff > 15) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || pointerStartXRef.current === null || pointerCurrentXRef.current === null) {
      isPointerDownRef.current = false;
      setIsInteracting(false);
      dragOffsetRef.current = 0;
      if (trackRef.current) {
        trackRef.current.style.transition = "";
      }
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      return;
    }

    const diff = pointerStartXRef.current - pointerCurrentXRef.current;
    const threshold = 50; // Порог 50px

    // Восстанавливаем transition
    if (trackRef.current) {
      trackRef.current.style.transition = "";
    }

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Свайп вправо → следующий
        handleNext();
      } else {
        // Свайп влево → предыдущий
        handlePrev();
      }
    } else {
      // Недостаточный свайп → возвращаемся к текущему индексу
      dragOffsetRef.current = 0;
      goToIndex(currentIndex, true);
    }

    isPointerDownRef.current = false;
    setTimeout(() => setIsInteracting(false), 1000);
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    pointerCurrentXRef.current = null;
    
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleMouseEnter = () => {
    if (autoScroll) {
      setIsInteracting(true);
    }
  };

  const handleMouseLeave = () => {
    if (autoScroll) {
      setTimeout(() => setIsInteracting(false), 500);
    }
  };

  // Автопрокрутка
  useEffect(() => {
    if (!autoScroll || prefersReducedMotion || isInteracting || originalLength <= 1 || isTransitioning) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      if (isInteracting || isTransitioning) return;
      scrollNext(true);
    }, autoScrollInterval);

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [autoScroll, autoScrollInterval, isInteracting, originalLength, prefersReducedMotion, scrollNext, isTransitioning]);

  // Вычисляем реальный индекс для отображения
  const getRealIndex = useCallback((index: number) => {
    if (!infinite) return index;
    
    if (index === 0) {
      return originalLength - 1; // Клон last
    } else if (index === extendedItems.length - 1) {
      return 0; // Клон first
    } else {
      return index - 1; // Реальные элементы
    }
  }, [infinite, originalLength, extendedItems.length]);

  // Получаем стили для карточки (scale, opacity, z-index)
  const getCardStyles = useCallback((index: number) => {
    // Прямое сравнение индексов в displayItems
    // index - это индекс в displayItems (extendedItems для infinite, processedItems для обычной)
    // currentIndex - это индекс в displayItems
    
    // Сначала проверяем точное совпадение
    if (index === currentIndex) {
      return { scale: 1, opacity: 1, zIndex: 20 };
    }
    
    // Вычисляем разницу
    let diff = Math.abs(index - currentIndex);
    
    // Для infinite карусели учитываем wrap-around через минимальное расстояние
    if (infinite && extendedItems.length > 0) {
      const lastIndex = extendedItems.length - 1;
      
      // Специальная обработка для клонов (в обе стороны):
      // - index = 0 (клон last) должен быть соседним к currentIndex = 1 (первый реальный)
      // - index = 1 (первый реальный) должен быть соседним к currentIndex = 0 (клон last)
      // - index = lastIndex (клон first) должен быть соседним к currentIndex = originalLength (последний реальный)
      // - index = originalLength (последний реальный) должен быть соседним к currentIndex = lastIndex (клон first)
      
      if ((index === 0 && currentIndex === 1) || (index === 1 && currentIndex === 0)) {
        diff = 1; // Клон last и первый реальный - соседние
      } else if ((index === lastIndex && currentIndex === originalLength) || 
                 (index === originalLength && currentIndex === lastIndex)) {
        diff = 1; // Клон first и последний реальный - соседние
      } else {
        // Обычная логика wrap-around
        const forwardDiff = diff;
        const backwardDiff = extendedItems.length - diff;
        diff = Math.min(forwardDiff, backwardDiff);
      }
    }

    // Строгая логика согласно требованиям:
    // diff === 0 → активная карточка (уже обработано выше)
    // diff === 1 → соседняя карточка (scale: 0.9, opacity: 0.8, z-10)
    // diff > 1 → остальные (scale: 0.7, opacity: 0.5, z-0)
    
    if (diff === 1) {
      return { scale: 0.9, opacity: 0.8, zIndex: 10 };
    } else {
      return { scale: 0.7, opacity: 0.5, zIndex: 0 };
    }
  }, [currentIndex, infinite, extendedItems.length, originalLength]);

  // Получаем rotateY для 3D эффекта
  const getRotateY = useCallback((index: number) => {
    if (!enable3D || prefersReducedMotion) return 0;
    
    // Вычисляем разницу в индексах extendedItems
    const diff = index - currentIndex;
    
    // Для infinite карусели учитываем wrap-around
    let actualDiff = diff;
    if (infinite && extendedItems.length > 0) {
      const half = Math.floor(extendedItems.length / 2);
      if (Math.abs(diff) > half) {
        actualDiff = diff > 0 ? diff - extendedItems.length : diff + extendedItems.length;
      }
    }

    if (actualDiff === 0) return 0;
    if (actualDiff === 1) return 6;
    if (actualDiff === -1) return -6;
    return 0;
  }, [currentIndex, infinite, extendedItems.length, enable3D, prefersReducedMotion]);

  if (extendedItems.length === 0) return null;

  const displayItems = infinite ? extendedItems : processedItems;
  const translateX = getTranslateX();
  const transitionDuration = isTransitioning && !prefersReducedMotion ? 500 : 0;

  return (
    <div className={`relative ${className}`}>
      {showArrows && originalLength > 1 && (
        <div className="mb-4 hidden items-center justify-end gap-2 md:flex">
          <button
            type="button"
            aria-label="Предыдущий"
            onClick={handlePrev}
            disabled={isTransitioning}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Следующий"
            onClick={handleNext}
            disabled={isTransitioning}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] transition hover:bg-[var(--color-bg-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        aria-label={ariaLabel}
        role="region"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden"
        style={{
          ...(enable3D ? { perspective: "1000px" } : {}),
          touchAction: "pan-y pinch-zoom", // Разрешаем вертикальный скролл и pinch-zoom, горизонтальный обрабатываем через pointer events
          // Убеждаемся, что нет глобального затемнения
          filter: "none",
          opacity: 1,
          // Не блокируем wheel события
          pointerEvents: "auto",
        }}
      >
        <div
          ref={trackRef}
          className="flex items-center justify-center gap-4"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: transitionDuration > 0 
              ? `transform ${transitionDuration}ms ease-out` 
              : "none",
            willChange: isTransitioning ? "transform" : "auto",
          }}
        >
          {displayItems.map((item, index) => {
            const realIndex = getRealIndex(index);
            const cardStyles = getCardStyles(index);
            const rotateY = getRotateY(index);
            
            return (
              <div
                key={infinite ? `carousel-item-${index}-${realIndex}` : `carousel-item-${index}`}
                className={`shrink-0 ${itemClassName}`}
                style={{
                  transform: `scale(${cardStyles.scale}) ${enable3D ? `rotateY(${rotateY}deg)` : ""}`,
                  opacity: cardStyles.opacity,
                  zIndex: cardStyles.zIndex,
                  transition: prefersReducedMotion 
                    ? "none" 
                    : "all 500ms ease-out",
                  transformStyle: enable3D ? "preserve-3d" : undefined,
                  willChange: prefersReducedMotion ? "auto" : "transform, opacity",
                  // Убеждаемся, что нет глобального затемнения
                  filter: "none",
                  // Используем transform-gpu для лучшей производительности
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                onClick={(e) => {
                  if (onItemClick && !(e.target as HTMLElement).closest("a, button")) {
                    onItemClick(item, realIndex);
                  }
                }}
                role={onItemClick ? "button" : undefined}
                tabIndex={onItemClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onItemClick(item, realIndex);
                  }
                }}
              >
                {renderItem(item, realIndex)}
              </div>
            );
          })}
        </div>
      </div>

      {showProgress && originalLength > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2" role="status" aria-live="polite">
          <div className="flex gap-1.5">
            {Array.from({ length: originalLength }).map((_, index) => {
              const currentRealIndex = getRealIndex(currentIndex);
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Перейти к слайду ${index + 1}`}
                  onClick={() => {
                    if (infinite) {
                      goToIndex(index + 1); // +1 потому что первый элемент - клон last
                    } else {
                      goToIndex(index);
                    }
                    setIsInteracting(true);
                    setTimeout(() => setIsInteracting(false), 1000);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentRealIndex
                      ? "w-6 bg-[var(--color-primary)]"
                      : "w-1.5 bg-[var(--color-border)] hover:bg-[var(--color-text)]/40"
                  }`}
                />
              );
            })}
          </div>
          <span className="ml-2 text-xs text-[var(--color-text)]/60">
            {getRealIndex(currentIndex) + 1} / {originalLength}
          </span>
        </div>
      )}
    </div>
  );
}
