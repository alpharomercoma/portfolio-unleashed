import { ArrowUpRight } from "lucide-react";

// The two labs, each in its own colour and with a plain line on what it does. They
// open Experience, where the roles below them give the context. Their sub-projects
// stay on their own sites, apart from the ones listed under Projects.
const labs = [
	{
		name: "Experimental Machines",
		href: "https://experimentalmachines.org",
		surface: "surface-machines",
		tagline: "Android apps, runtimes, and benchmarks for on-device LLMs.",
	},
	{
		name: "Experimental Intelligence",
		href: "https://experimentalintelligence.org",
		surface: "surface-intelligence",
		tagline: "Trains small models in the open.",
	},
];

export function LabCards() {
	return (
		<ul className="mb-8 grid gap-4 md:grid-cols-2 lg:mb-10">
			{labs.map((lab) => (
				<li
					key={lab.href}
					className={`${lab.surface} flex flex-col rounded-[1.25rem] p-6`}
				>
					<p className="text-sm font-medium">Co-founder</p>
					<h3 className="display-md mt-1 font-semibold">{lab.name}</h3>
					<p className="mt-2">{lab.tagline}</p>
					<a
						href={lab.href}
						target="_blank"
						rel="noopener noreferrer"
						className="on-color-link mt-3 inline-flex min-h-10 w-fit items-center gap-1.5 text-sm font-medium"
					>
						Visit {lab.name}
						<ArrowUpRight className="size-4" aria-hidden />
					</a>
				</li>
			))}
		</ul>
	);
}
