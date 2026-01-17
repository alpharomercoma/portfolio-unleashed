"use client";

import useEmblaCarousel, {
	type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
	opts?: CarouselOptions;
	plugins?: CarouselPlugin;
	orientation?: "horizontal" | "vertical";
	setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: ReturnType<typeof useEmblaCarousel>[1];
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
	const context = React.useContext(CarouselContext);

	if (!context) {
		throw new Error("useCarousel must be used within a <Carousel />");
	}

	return context;
}

function Carousel({
	orientation = "horizontal",
	opts,
	setApi,
	plugins,
	className,
	children,
	...props
}: React.ComponentProps<"div"> & CarouselProps) {
	const [carouselRef, api] = useEmblaCarousel(
		{
			...opts,
			axis: orientation === "horizontal" ? "x" : "y",
		},
		plugins,
	);
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);

	const onSelect = React.useCallback((api: CarouselApi) => {
		if (!api) return;
		setCanScrollPrev(api.canScrollPrev());
		setCanScrollNext(api.canScrollNext());
	}, []);

	const scrollPrev = React.useCallback(() => {
		api?.scrollPrev();
	}, [api]);

	const scrollNext = React.useCallback(() => {
		api?.scrollNext();
	}, [api]);

	const handleKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				scrollNext();
			}
		},
		[scrollPrev, scrollNext],
	);

	React.useEffect(() => {
		if (!api || !setApi) return;
		setApi(api);
	}, [api, setApi]);

	React.useEffect(() => {
		if (!api) return;
		onSelect(api);
		api.on("reInit", onSelect);
		api.on("select", onSelect);

		return () => {
			api?.off("select", onSelect);
		};
	}, [api, onSelect]);

	return (
		<CarouselContext.Provider
			value={{
				carouselRef,
				api: api,
				opts,
				orientation:
					orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
				scrollPrev,
				scrollNext,
				canScrollPrev,
				canScrollNext,
			}}
		>
			<div
				onKeyDownCapture={handleKeyDown}
				className={cn("relative", className)}
				role="region"
				aria-roledescription="carousel"
				data-slot="carousel"
				{...props}
			>
				{children}
			</div>
		</CarouselContext.Provider>
	);
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
	const { carouselRef, orientation } = useCarousel();

	return (
		<div
			ref={carouselRef}
			className="overflow-hidden"
			data-slot="carousel-content"
		>
			<div
				className={cn(
					"flex",
					orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
	const { orientation } = useCarousel();

	return (
		<div
			role="group"
			aria-roledescription="slide"
			data-slot="carousel-item"
			className={cn(
				"min-w-0 shrink-0 grow-0 basis-full",
				orientation === "horizontal" ? "pl-4" : "pt-4",
				className,
			)}
			{...props}
		/>
	);
}

function CarouselPrevious({
	className,
	variant = "outline",
	size = "icon",
	...props
}: React.ComponentProps<typeof Button>) {
	const { orientation, scrollPrev, canScrollPrev } = useCarousel();

	return (
		<Button
			data-slot="carousel-previous"
			variant={variant}
			size={size}
			className={cn(
				"absolute size-8 rounded-full",
				orientation === "horizontal"
					? "top-1/2 -left-12 -translate-y-1/2"
					: "-top-12 left-1/2 -translate-x-1/2 rotate-90",
				className,
			)}
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			{...props}
		>
			<ArrowLeft />
			<span className="sr-only">Previous slide</span>
		</Button>
	);
}

function CarouselNext({
	className,
	variant = "outline",
	size = "icon",
	...props
}: React.ComponentProps<typeof Button>) {
	const { orientation, scrollNext, canScrollNext } = useCarousel();

	return (
		<Button
			data-slot="carousel-next"
			variant={variant}
			size={size}
			className={cn(
				"absolute size-8 rounded-full",
				orientation === "horizontal"
					? "top-1/2 -right-12 -translate-y-1/2"
					: "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
				className,
			)}
			disabled={!canScrollNext}
			onClick={scrollNext}
			{...props}
		>
			<ArrowRight />
			<span className="sr-only">Next slide</span>
		</Button>
	);
}

// Custom hook for paginated carousel state with auto-rotation
export function useCarouselPagination<T>(
	items: T[],
	itemsPerPage: number,
	autoRotateInterval?: number,
) {
	const [currentPage, setCurrentPage] = React.useState(0);
	const [isAutoRotating, setIsAutoRotating] =
		React.useState(!!autoRotateInterval);
	const [isTransitioning, setIsTransitioning] = React.useState(false);
	const totalPages = Math.ceil(items.length / itemsPerPage);
	const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

	const currentItems = items.slice(
		currentPage * itemsPerPage,
		(currentPage + 1) * itemsPerPage,
	);

	const changePage = React.useCallback((newPage: number) => {
		setIsTransitioning(true);
		// Small delay for exit animation
		setTimeout(() => {
			setCurrentPage(newPage);
			// Reset transitioning after entry animation completes
			setTimeout(() => setIsTransitioning(false), 300);
		}, 50);
	}, []);

	const nextPage = React.useCallback(() => {
		changePage((currentPage + 1) % totalPages);
	}, [changePage, currentPage, totalPages]);

	const prevPage = React.useCallback(() => {
		changePage((currentPage - 1 + totalPages) % totalPages);
	}, [changePage, currentPage, totalPages]);

	const goToPage = React.useCallback(
		(page: number) => {
			changePage(page);
		},
		[changePage],
	);

	// Stop auto-rotation (called when user interacts)
	const stopAutoRotate = React.useCallback(() => {
		setIsAutoRotating(false);
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	// Handle auto-rotation
	React.useEffect(() => {
		if (!isAutoRotating || !autoRotateInterval || totalPages <= 1) {
			return;
		}

		intervalRef.current = setInterval(() => {
			setCurrentPage((prev) => (prev + 1) % totalPages);
		}, autoRotateInterval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isAutoRotating, autoRotateInterval, totalPages]);

	return {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
		isTransitioning,
	};
}

// Alias for backwards compatibility
export { useCarouselPagination as useCarousel };

// Carousel controls component
interface CarouselControlsProps {
	currentPage: number;
	totalPages: number;
	onPrev: () => void;
	onNext: () => void;
	onUserInteraction?: () => void;
	isAutoRotating?: boolean;
	className?: string;
}

export function CarouselControls({
	currentPage,
	totalPages,
	onPrev,
	onNext,
	onUserInteraction,
	isAutoRotating,
	className,
}: CarouselControlsProps) {
	if (totalPages <= 1) return null;

	const handlePrev = () => {
		onUserInteraction?.();
		onPrev();
	};

	const handleNext = () => {
		onUserInteraction?.();
		onNext();
	};

	return (
		<div
			className={cn("flex items-center gap-2", className)}
			style={{ animationDelay: "200ms" }}
		>
			{isAutoRotating && (
				<span className="relative flex h-2 w-2 mr-1">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-blue)] opacity-75" />
					<span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-blue)]" />
				</span>
			)}
			<span className="text-xs text-muted-foreground mr-2">
				{currentPage + 1}&nbsp;/&nbsp;{totalPages}
			</span>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 cursor-pointer rounded-full bg-transparent transition-all duration-200 hover:scale-110 active:scale-95"
				onClick={handlePrev}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 cursor-pointer rounded-full bg-transparent transition-all duration-200 hover:scale-110 active:scale-95"
				onClick={handleNext}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

// Carousel dots/pagination indicators
interface CarouselDotsProps {
	currentPage: number;
	totalPages: number;
	onGoToPage: (page: number) => void;
	onUserInteraction?: () => void;
	className?: string;
}

export function CarouselDots({
	currentPage,
	totalPages,
	onGoToPage,
	onUserInteraction,
	className,
}: CarouselDotsProps) {
	if (totalPages <= 1) return null;

	const handleGoToPage = (page: number) => {
		onUserInteraction?.();
		onGoToPage(page);
	};

	return (
		<div className={cn("flex justify-center gap-1.5", className)}>
			{Array.from({ length: totalPages }).map((_, i) => (
				<button
					key={i}
					onClick={() => handleGoToPage(i)}
					className={cn(
						"h-1.5 rounded-full transition-all duration-300 hover:opacity-80",
						i === currentPage
							? "w-6 bg-[var(--color-blue)]"
							: "w-1.5 bg-border hover:bg-muted-foreground/30",
					)}
					aria-label={`Go to page ${i + 1}`}
				/>
			))}
		</div>
	);
}

export {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
};
