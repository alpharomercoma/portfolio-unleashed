import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";

// Each logo gets a class that evens out its visual mass, because the files have
// very different aspect ratios.
const affiliations = [
	{ name: "AWS", logo: "/aws.png", size: "h-6 sm:h-7" },
	{ name: "Google Cloud", logo: "/gcp.png", size: "h-7 sm:h-8" },
	{ name: "PyTorch", logo: "/pytorch.png", size: "h-5 sm:h-6" },
	{ name: "GitHub", logo: "/github.jpg", size: "h-7 sm:h-8" },
];

export function HeroSection() {
	return (
		<>
			<section className="surface-brand">
				<div className="site-container pb-12 pt-6 sm:pt-8 lg:pb-16 lg:pt-10">
					<h1 className="wordmark">Alpha Romer Coma</h1>

					<div className="mt-5 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
						<p className="display-md max-w-2xl text-pretty">
							Machine learning engineer working with on-device LLMs and AI
							accelerators.
						</p>
						<div className="flex shrink-0 flex-wrap items-center gap-3">
							<Button asChild variant="on-color">
								<Link href="/#work">See the work</Link>
							</Button>
							<Button asChild variant="on-color-outline">
								<Link href="/#contact">Get in touch</Link>
							</Button>
							<div className="flex items-center gap-3">
								<Button
									asChild
									size="icon"
									variant="on-color-outline"
									aria-label="GitHub profile"
								>
									<a
										href="https://github.com/alpharomercoma"
										target="_blank"
										rel="noopener noreferrer"
									>
										<Github aria-hidden />
									</a>
								</Button>
								<Button
									asChild
									size="icon"
									variant="on-color-outline"
									aria-label="LinkedIn profile"
								>
									<a
										href="https://linkedin.com/in/alpharomercoma"
										target="_blank"
										rel="noopener noreferrer"
									>
										<Linkedin aria-hidden />
									</a>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section
				aria-labelledby="affiliations-title"
				className="site-container flex flex-col gap-4 pt-8 lg:flex-row lg:items-center lg:gap-12"
			>
				<h2
					id="affiliations-title"
					className="text-sm font-medium text-muted-foreground"
				>
					Affiliated with
				</h2>
				<ul className="flex flex-wrap items-center gap-x-8 gap-y-4 sm:gap-x-12">
					{affiliations.map((company) => (
						<li key={company.name}>
							<Image
								src={`/affiliations${company.logo}`}
								alt={company.name}
								width={120}
								height={48}
								className={`w-auto object-contain mix-blend-multiply grayscale ${company.size}`}
							/>
						</li>
					))}
				</ul>
			</section>
		</>
	);
}
