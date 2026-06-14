"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";

type Award = {
	title: string;
	organization: string;
	year: string;
	image: string;
	context: string;
	category: "AI & Research" | "Hackathon" | "Language" | "Recognition";
};

const awards: Award[] = [
	{
		title: "PH100: 100 Brightest Minds of the Philippines",
		organization: "Stellar PH",
		year: "2025",
		image: "ph100.png",
		context:
			"Inducted into Stellar PH's inaugural cohort of the 100 brightest young minds across industries, from a nationwide pool of nominees.",
		category: "Recognition",
	},
	{
		title: "National AI Prompt Design Challenge PH Champion",
		organization: "Straits Interactive",
		year: "2025",
		image: "naipdc.jpg",
		context:
			"Won nationally with Kasanayan Navigator, a chain-of-thought chatbot that upskills Filipinos toward their desired role.",
		category: "AI & Research",
	},
	{
		title: "Philippine Junior Data Science Challenge Finalist",
		organization: "UP Data Science Society",
		year: "2024",
		image: "pjdsc.jpg",
		context:
			"Finalist and GlobalCo Special Award recipient for Para Po!, a transport route optimizer with an incentivized carbon-reduction program.",
		category: "AI & Research",
	},
	{
		title: "Codetober Web Development Champions",
		organization: "FEU Tech AITS",
		year: "2024",
		image: "codetober.png",
		context:
			"Shipped Kape ni Rab, a full coffee-shop site, in 48 hours to take the FEU Tech Alliance of IT Students' annual dev challenge.",
		category: "Hackathon",
	},
	{
		title: "Algolympics Finalist",
		organization: "UP Diliman ACM",
		year: "2024",
		image: "algolympics.png",
		context:
			"Finalist at the premier competitive-programming tournament of the UP Diliman ACM Student Chapter.",
		category: "Hackathon",
	},
	{
		title: "NASA Space Apps Challenge Global Nominee",
		organization: "NASA",
		year: "2023",
		image: "nasa_nominee_23.png",
		context:
			"Globally nominated with Fireguard, a satellite-driven, community-based fire-management system for the Philippines.",
		category: "Hackathon",
	},
];

type Certification = {
	title: string;
	issuer: string;
	logo: string;
	date: string;
	link: string;
};

const certifications: Certification[] = (
	[
		{
			title: "JavaScript Algorithms and Data Structures",
			issuer: "FreeCodeCamp",
			logo: "FCC.png",
			date: "2022-07-09",
			link: "https://www.freecodecamp.org/certification/alphacoma18/javascript-algorithms-and-data-structures",
		},
		{
			title: "Back End Development and APIs",
			issuer: "FreeCodeCamp",
			logo: "FCC.png",
			date: "2022-08-03",
			link: "https://www.freecodecamp.org/certification/alphacoma18/back-end-development-and-apis",
		},
		{
			title: "Foundational C# with Microsoft",
			issuer: "FreeCodeCamp",
			logo: "FCC.png",
			date: "2023-10-13",
			link: "https://freecodecamp.org/certification/alpha-coma/foundational-c-sharp-with-microsoft",
		},
		{
			title: "CS50x: Introduction to Computer Science",
			issuer: "Harvard University",
			logo: "harvard.jpg",
			date: "2023-12-22",
			link: "https://certificates.cs50.io/70f8307b-9c42-4fb9-a931-14d5e835a834.pdf?size=letter",
		},
		{
			title: "GitHub Foundations",
			issuer: "GitHub",
			logo: "github.png",
			date: "2024-01-27",
			link: "https://www.credly.com/badges/59e40eef-9a77-43fd-8aa1-de64bd1b5a37",
		},
		{
			title: "Front End Development Libraries",
			issuer: "FreeCodeCamp",
			logo: "FCC.png",
			date: "2024-06-23",
			link: "https://www.freecodecamp.org/certification/alpha-coma/front-end-development-libraries",
		},
		{
			title: "Information Technology Specialist in Python",
			issuer: "Certiport",
			logo: "certiport.jpg",
			date: "2024-07-14",
			link: "https://www.credly.com/badges/d2cba34f-80c8-44a2-ae3a-019407612b90",
		},
		{
			title: "Oracle Cloud Infrastructure 2024 Generative AI Professional",
			issuer: "Oracle",
			logo: "oci.png",
			date: "2024-07-29",
			link: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=66DB4958222C3A7B8EB90BFD0AFF59F72149D7BCC33B39F331061F2044643166",
		},
		{
			title: "GitHub Administration",
			issuer: "GitHub",
			logo: "github.png",
			date: "2024-08-05",
			link: "https://www.credly.com/badges/d11f87a6-bfcb-4f21-922c-a00c23a0ea0b/public_url",
		},
		{
			title: "GitHub Advanced Security",
			issuer: "GitHub",
			logo: "github.png",
			date: "2024-08-10",
			link: "https://www.credly.com/badges/ba18ce6a-4190-4680-905b-61149b9ac675/public_url",
		},
		{
			title: "GitHub Actions",
			issuer: "GitHub",
			logo: "github.png",
			date: "2024-08-12",
			link: "https://www.credly.com/badges/49a69c52-5186-4fac-a101-9531d5f41cd0/public_url",
		},
		{
			title: "Certified AppSec Practitioner (CAP)",
			issuer: "The SecOps Group",
			logo: "secops.jpg",
			date: "2024-08-12",
			link: "",
		},
		{
			title: "Cisco CCNA: Introduction to Networks",
			issuer: "Cisco",
			logo: "cisco.png",
			date: "2024-09-20",
			link: "https://www.credly.com/badges/c3e411bd-2f7b-445d-bb20-ce4e191667b0/public_url",
		},
		{
			title: "Microsoft Certified: Azure Fundamentals",
			issuer: "Microsoft",
			logo: "microsoft.png",
			date: "2024-10-08",
			link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/FFD20E7A4CB76E82?sharingId",
		},
		{
			title: "GitHub Copilot",
			issuer: "GitHub",
			logo: "github.png",
			date: "2024-10-09",
			link: "https://www.credly.com/badges/df7c0d7f-96e5-4a17-b063-d3e03f91d2e2/public_url",
		},
		{
			title: "AI Associate",
			issuer: "Salesforce",
			logo: "salesforce.png",
			date: "2024-11-06",
			link: "https://trailhead.salesforce.com/en/credentials/certification-detail-print/?searchString=1q75ORYKJY/5EcgRkX17sio5ciSo5CK2gt5/YcKKiahFYjzhs1RSE2VFNV79c3di",
		},
		{
			title: "Microsoft Certified: Azure AI Fundamentals",
			issuer: "Microsoft",
			logo: "microsoft.png",
			date: "2025-03-09",
			link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/42E56DA981C5FAAD?sharingId",
		},
		{
			title: "Cloud Digital Leader Certification",
			issuer: "Google",
			logo: "google.png",
			date: "2025-03-09",
			link: "https://www.credly.com/badges/c118b804-1532-466d-908d-49eb0277ca15/linked_in_profile",
		},
		{
			title: "Microsoft Certified: Azure Data Fundamentals",
			issuer: "Microsoft",
			logo: "microsoft.png",
			date: "2025-03-15",
			link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/D03EB5967F34272A?sharingId",
		},
		{
			title: "Microsoft Certified: Azure AI Engineer Associate",
			issuer: "Microsoft",
			logo: "microsoft.png",
			date: "2025-03-16",
			link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/BEECBE94524A21B4?sharingId",
		},
		{
			title: "PMI Project Management Ready",
			issuer: "PMI",
			logo: "pmi.png",
			date: "2025-03-26",
			link: "https://www.certiport.com/portal/Pages/PrintTranscriptInfo.aspx?action=Cert&id=457&cvid=9Om6RZuqbFMbIM6kygizPA==",
		},
		{
			title: "Associate Cloud Engineer Certification",
			issuer: "Google",
			logo: "google.png",
			date: "2025-04-13",
			link: "https://www.credly.com/badges/197a51dd-409d-40b1-ba17-2b78bb1c30b1/linked_in_profile",
		},
		{
			title: "Professional Machine Learning Engineer Certification",
			issuer: "Google",
			logo: "google.png",
			date: "2025-05-11",
			link: "https://www.credly.com/badges/4199288a-f45e-4584-87d3-a73397d2692c/linked_in_profile",
		},
		{
			title: "Oracle Cloud Infrastructure 2025 Generative AI Professional",
			issuer: "Oracle",
			logo: "oci.png",
			date: "2025-07-14",
			link: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=09C717FD1428F3C34B3B54C1AA51A3463C7843A2AE2EDB02ED1DFB32DF11D78B",
		},
		{
			title: "AWS Certified AI Practitioner",
			issuer: "AWS",
			logo: "aws.png",
			date: "2025-07-27",
			link: "https://www.credly.com/badges/51675536-28ff-40f2-ac7b-f8003bda3bb3/linked_in_profile",
		},
		{
			title: "Generative AI Leader Certification",
			issuer: "Google",
			logo: "google.png",
			date: "2025-08-02",
			link: "https://www.credly.com/badges/0d8cac99-a09d-4ee9-86ac-13ec16a066ff/public_url",
		},
		{
			title: "AWS Certified Machine Learning Engineer, Associate",
			issuer: "AWS",
			logo: "aws.png",
			date: "2025-12-30",
			link: "https://www.credly.com/badges/89a55bb2-8f32-4938-84a1-683f21bb0e64/public_url",
		},
	] satisfies Certification[]
).sort((a, b) => (a.date < b.date ? 1 : -1));

const TOTAL_CREDENTIALS = certifications.length;
const CERTS_PER_PAGE = 6; // 2 columns x 3 rows

function formatDate(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function RecognitionSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
	} = useCarousel(certifications, CERTS_PER_PAGE);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-fade-up");
					}
				});
			},
			{ threshold: 0.1 },
		);
		const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
		elements?.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			id="recognition"
			className="py-20 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-lime-wash border-t border-border"
		>
			<div className="max-w-6xl mx-auto">
				<div className="animate-on-scroll opacity-0 mb-12 sm:mb-16 max-w-3xl">
					<h2 className="display-lg mb-5">
						Honored as a PH100 mind and the national AI{" "}
						<span className="lime-mark">champion</span>.
					</h2>
					<p className="lede">
						Awards across AI research and hackathons, plus {TOTAL_CREDENTIALS}{" "}
						industry credentials from Google, Microsoft, AWS, GitHub, and more.
					</p>
				</div>

				{/* Awards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{awards.map((award, index) => (
						<article
							key={award.title}
							className="animate-on-scroll opacity-0 flex flex-col rounded-3xl overflow-hidden bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:border-foreground/25"
							style={{ animationDelay: `${index * 70}ms` }}
						>
							<div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
								<Image
									src={"/awards/" + award.image}
									alt={award.title}
									fill
									sizes="(max-width: 640px) 100vw, 33vw"
									className="object-cover"
								/>
							</div>
							<div className="flex flex-col flex-1 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-2 mb-3">
									<span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
										<span
											aria-hidden
											className="size-1.5 rounded-full bg-lime"
										/>
										{award.category}
									</span>
									<span className="font-mono text-xs text-muted-foreground tabular-nums">
										{award.year}
									</span>
								</div>
								<h3 className="font-display text-base font-semibold text-foreground leading-snug tracking-tight mb-1.5">
									{award.title}
								</h3>
								<p className="text-xs font-medium text-muted-foreground mb-2.5">
									{award.organization}
								</p>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{award.context}
								</p>
							</div>
						</article>
					))}
				</div>

				{/* Certifications: 2 x 3 paginated carousel */}
				<div className="animate-on-scroll opacity-0 mt-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
						<div>
							<h3 className="font-display text-xl font-semibold tracking-tight">
								{TOTAL_CREDENTIALS} industry credentials
							</h3>
							<p className="text-sm text-muted-foreground mt-1">
								Cloud, ML, and security certifications across the major
								platforms.
							</p>
						</div>
						<CarouselControls
							currentPage={currentPage}
							totalPages={totalPages}
							onPrev={prevPage}
							onNext={nextPage}
							onUserInteraction={stopAutoRotate}
							isAutoRotating={isAutoRotating}
							className="shrink-0"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{currentItems.map((cert, index) => (
							<Link
								key={`${cert.title}-${currentPage}`}
								href={cert.link || "#"}
								target={cert.link ? "_blank" : undefined}
								rel={cert.link ? "noopener noreferrer" : undefined}
								className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25"
								style={{
									animation: "fadeIn 0.3s ease forwards",
									animationDelay: `${index * 40}ms`,
									opacity: 0,
								}}
							>
								<span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary overflow-hidden">
									<Image
										src={"/certification/logo/" + cert.logo}
										alt={cert.issuer}
										width={28}
										height={28}
										className="size-6 object-contain"
									/>
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium text-foreground leading-snug line-clamp-2">
										{cert.title}
									</span>
									<span className="block text-xs text-muted-foreground mt-0.5">
										{cert.issuer} · {formatDate(cert.date)}
									</span>
								</span>
								{cert.link && (
									<ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
								)}
							</Link>
						))}
					</div>

					<CarouselDots
						currentPage={currentPage}
						totalPages={totalPages}
						onGoToPage={goToPage}
						onUserInteraction={stopAutoRotate}
						className="mt-6"
					/>
				</div>
			</div>
		</section>
	);
}
