import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The rest of a list, out of the way until someone asks for it. A native disclosure,
// so it works from the keyboard and without any script, and stays in the page.
export function ShowMore({
	count,
	children,
}: {
	count: number;
	children: React.ReactNode;
}) {
	return (
		<details className="group mt-8">
			<summary
				className={cn(
					buttonVariants({ variant: "outline" }),
					"cursor-pointer list-none [&::-webkit-details-marker]:hidden",
				)}
			>
				<span className="group-open:hidden">Show {count} more</span>
				<span className="hidden group-open:inline">Show fewer</span>
			</summary>
			{children}
		</details>
	);
}
