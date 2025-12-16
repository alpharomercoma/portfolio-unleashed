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

// Custom hook for paginated carousel state
export function useCarouselPagination<T>(items: T[], itemsPerPage: number) {
	const [currentPage, setCurrentPage] = React.useState(0);
	const totalPages = Math.ceil(items.length / itemsPerPage);

	const currentItems = items.slice(
		currentPage * itemsPerPage,
		(currentPage + 1) * itemsPerPage,
	);

	const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
	const prevPage = () =>
		setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
	const goToPage = (page: number) => setCurrentPage(page);

	return {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
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
	className?: string;
}

export function CarouselControls({
	currentPage,
	totalPages,
	onPrev,
	onNext,
	className,
}: CarouselControlsProps) {
	if (totalPages <= 1) return null;

	return (
		<div
			className={cn("flex items-center gap-2", className)}
			style={{ animationDelay: "200ms" }}
		>
			<span className="text-xs text-muted-foreground mr-2">
				{currentPage + 1}&nbsp;/&nbsp;{totalPages}
			</span>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 cursor-pointer rounded-full bg-transparent"
				onClick={onPrev}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8 cursor-pointer rounded-full bg-transparent"
				onClick={onNext}
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
	className?: string;
}

export function CarouselDots({
	currentPage,
	totalPages,
	onGoToPage,
	className,
}: CarouselDotsProps) {
	if (totalPages <= 1) return null;

	return (
		<div className={cn("flex justify-center gap-1.5", className)}>
			{Array.from({ length: totalPages }).map((_, i) => (
				<button
					key={i}
					onClick={() => onGoToPage(i)}
					className={cn(
						"h-1.5 rounded-full transition-all duration-300",
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
