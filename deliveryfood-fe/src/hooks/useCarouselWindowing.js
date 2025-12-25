// src/hooks/useCarouselWindowing.js
import { useMemo, useState, useEffect, useCallback } from "react";
import { Grid } from "antd";

const { useBreakpoint } = Grid;

/**
 * Custom hook để quản lý windowing logic cho carousel
 * @param {Array} items - Mảng items cần render
 * @param {number} buffer - Số items render thêm ở hai bên (default: 2)
 * @returns {Object} - Object chứa các state và methods cần thiết
 */
export function useCarouselWindowing(items = [], buffer = 2) {
    const screens = useBreakpoint();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Tính số items hiển thị dựa vào breakpoint
    const visibleItems = useMemo(() => {
        if (screens.xl) return 5;
        if (screens.lg) return 4;
        if (screens.md) return 3;
        if (screens.sm) return 2;
        return 1;
    }, [screens]);

    // Tính max index
    const maxIndex = useMemo(
        () => Math.max(0, items.length - visibleItems),
        [items.length, visibleItems]
    );

    // Tính step percent cho transform
    const stepPercent = useMemo(() => 100 / visibleItems, [visibleItems]);

    // Windowing: chỉ lấy items trong viewport + buffer
    const { windowItems, offsetIndex } = useMemo(() => {
        const start = Math.max(0, currentIndex - buffer);
        const end = Math.min(items.length, currentIndex + visibleItems + buffer);
        return {
            windowItems: items.slice(start, end),
            offsetIndex: currentIndex - start,
        };
    }, [items, currentIndex, visibleItems, buffer]);

    // Reset currentIndex khi visibleItems thay đổi
    useEffect(() => {
        setCurrentIndex(0);
    }, [visibleItems]);

    // Navigation methods
    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const goToSlide = useCallback((index) => {
        setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    }, [maxIndex]);

    return {
        // State
        currentIndex,
        visibleItems,
        maxIndex,
        stepPercent,
        windowItems,
        offsetIndex,

        // Methods
        nextSlide,
        prevSlide,
        goToSlide,
        setCurrentIndex,

        // Computed
        canGoPrev: currentIndex > 0,
        canGoNext: currentIndex < maxIndex,
        hasItems: items.length > 0,
    };
}

export default useCarouselWindowing;
