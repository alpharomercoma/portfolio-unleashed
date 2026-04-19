"use client";

import {
	CarouselControls,
	CarouselDots,
	useCarousel,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export const certifications = [
	{
		id: "1",
		title: "JavaScript Algorithms and Data Structures",
		issuer: "FreeCodeCamp",
		logo: "FCC.png",
		date: "2022-07-09",
		link: "https://www.freecodecamp.org/certification/alphacoma18/javascript-algorithms-and-data-structures",
	},
	{
		id: "2",
		title: "Back End Development and APIs",
		issuer: "FreeCodeCamp",
		logo: "FCC.png",
		date: "2022-08-03",
		link: "https://www.freecodecamp.org/certification/alphacoma18/back-end-development-and-apis",
	},
	{
		id: "3",
		title: "Foundational C# with Microsoft",
		issuer: "FreeCodeCamp",
		logo: "FCC.png",
		date: "2023-10-13",
		link: "https://freecodecamp.org/certification/alpha-coma/foundational-c-sharp-with-microsoft",
	},
	{
		id: "4",
		title: "CS50x: Introduction to Computer Science",
		issuer: "Harvard University",
		logo: "harvard.jpg",
		date: "2023-12-22",
		link: "https://certificates.cs50.io/70f8307b-9c42-4fb9-a931-14d5e835a834.pdf?size=letter",
	},
	{
		id: "5",
		title: "GitHub Foundations",
		issuer: "GitHub",
		logo: "github.png",
		date: "2024-01-27",
		link: "https://www.credly.com/badges/59e40eef-9a77-43fd-8aa1-de64bd1b5a37",
	},
	{
		id: "6",
		title: "Front End Development Libraries",
		issuer: "FreeCodeCamp",
		logo: "FCC.png",
		date: "2024-06-23",
		link: "https://www.freecodecamp.org/certification/alpha-coma/front-end-development-libraries",
	},
	{
		id: "7",
		title: "Information Technology Specialist in Python",
		issuer: "Certiport",
		logo: "certiport.jpg",
		date: "2024-07-14",
		link: "https://www.credly.com/badges/d2cba34f-80c8-44a2-ae3a-019407612b90",
	},
	{
		id: "8",
		title: "Oracle Cloud Infrastructure 2024 Generative AI Professional",
		issuer: "Oracle",
		logo: "oci.png",
		date: "2024-07-29",
		link: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=66DB4958222C3A7B8EB90BFD0AFF59F72149D7BCC33B39F331061F2044643166",
	},
	{
		id: "9",
		title: "GitHub Administration",
		issuer: "GitHub",
		logo: "github.png",
		date: "2024-08-05",
		link: "https://www.credly.com/badges/d11f87a6-bfcb-4f21-922c-a00c23a0ea0b/public_url",
	},
	{
		id: "10",
		title: "GitHub Advanced Security",
		issuer: "GitHub",
		logo: "github.png",
		date: "2024-08-10",
		link: "https://www.credly.com/badges/ba18ce6a-4190-4680-905b-61149b9ac675/public_url",
	},
	{
		id: "11",
		title: "GitHub Actions",
		issuer: "GitHub",
		logo: "github.png",
		date: "2024-08-12",
		link: "https://www.credly.com/badges/49a69c52-5186-4fac-a101-9531d5f41cd0/public_url",
	},
	{
		id: "12",
		title: "Certified AppSec Practitioner (CAP)",
		issuer: "The SecOps Group",
		logo: "secops.jpg",
		date: "2024-08-12",
		link: "",
	},
	{
		id: "13",
		title: "Cisco CCNA: Introduction to Networks",
		issuer: "Cisco",
		logo: "cisco.png",
		date: "2024-09-20",
		link: "https://www.credly.com/badges/c3e411bd-2f7b-445d-bb20-ce4e191667b0/public_url",
	},
	{
		id: "14",
		title: "Microsoft Certified: Azure Fundamentals",
		issuer: "Microsoft",
		logo: "microsoft.png",
		date: "2024-10-08",
		link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/FFD20E7A4CB76E82?sharingId",
	},
	{
		id: "15",
		title: "GitHub Copilot",
		issuer: "GitHub",
		logo: "github.png",
		date: "2024-10-09",
		link: "https://www.credly.com/badges/df7c0d7f-96e5-4a17-b063-d3e03f91d2e2/public_url",
	},
	{
		id: "16",
		title: "AI Associate",
		issuer: "Salesforce",
		logo: "salesforce.png",
		date: "2024-11-06",
		link: "https://trailhead.salesforce.com/en/credentials/certification-detail-print/?searchString=1q75ORYKJY/5EcgRkX17sio5ciSo5CK2gt5/YcKKiahFYjzhs1RSE2VFNV79c3di",
	},
	{
		id: "17",
		title: "Microsoft Certified: Azure AI Fundamentals",
		issuer: "Microsoft",
		logo: "microsoft.png",
		date: "2025-03-09",
		link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/42E56DA981C5FAAD?sharingId",
	},
	{
		id: "18",
		title: "Cloud Digital Leader Certification",
		issuer: "Google",
		logo: "google.png",
		date: "2025-03-09",
		link: "https://www.credly.com/badges/c118b804-1532-466d-908d-49eb0277ca15/linked_in_profile",
	},
	{
		id: "47",
		title: "Microsoft Certified: Azure Data Fundamentals",
		issuer: "Microsoft",
		logo: "microsoft.png",
		date: "2025-03-15",
		link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/D03EB5967F34272A?sharingId",
	},
	{
		id: "19",
		title: "Microsoft Certified: Azure AI Engineer Associate",
		issuer: "Microsoft",
		logo: "microsoft.png",
		date: "2025-03-16",
		link: "https://learn.microsoft.com/api/credentials/share/en-us/alpharomercoma/BEECBE94524A21B4?sharingId",
	},
	{
		id: "20",
		title: "PMI Project Management Ready®",
		issuer: "PMI",
		logo: "pmi.png",
		date: "2025-03-26",
		link: "https://www.certiport.com/portal/Pages/PrintTranscriptInfo.aspx?action=Cert&id=457&cvid=9Om6RZuqbFMbIM6kygizPA==",
	},
	{
		id: "21",
		title: "Associate Cloud Engineer Certification",
		issuer: "Google",
		logo: "google.png",
		date: "2025-04-13",
		link: "https://www.credly.com/badges/197a51dd-409d-40b1-ba17-2b78bb1c30b1/linked_in_profile",
	},
	{
		id: "22",
		title: "Professional Machine Learning Engineer Certification",
		issuer: "Google",
		logo: "google.png",
		date: "2025-05-11",
		link: "https://www.credly.com/badges/4199288a-f45e-4584-87d3-a73397d2692c/linked_in_profile",
	},
	{
		id: "23",
		title: "Oracle Cloud Infrastructure 2025 Generative AI Professional",
		issuer: "Oracle",
		logo: "oci.png",
		date: "2025-07-14",
		link: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=09C717FD1428F3C34B3B54C1AA51A3463C7843A2AE2EDB02ED1DFB32DF11D78B",
	},
	{
		id: "24",
		title: "AWS Certified AI Practitioner",
		issuer: "AWS",
		logo: "aws.png",
		date: "2025-07-27",
		link: "https://www.credly.com/badges/51675536-28ff-40f2-ac7b-f8003bda3bb3/linked_in_profile",
	},
	{
		id: "25",
		title: "Generative AI Leader Certification",
		issuer: "Google",
		logo: "google.png",
		date: "2025-08-02",
		link: "https://www.credly.com/badges/0d8cac99-a09d-4ee9-86ac-13ec16a066ff/public_url",
	},
	{
		id: "26",
		title: "AWS Certified Machine Learning Engineer - Associate",
		issuer: "AWS",
		logo: "aws.png",
		date: "2025-12-30",
		link: "https://www.credly.com/badges/89a55bb2-8f32-4938-84a1-683f21bb0e64/public_url",
	},
].sort((a, b) => (a.date < b.date ? 1 : -1));

// Primary issuers to surface as filter chips; everything else falls under "Other".
const PRIMARY_ISSUERS = [
	"Google",
	"Microsoft",
	"AWS",
	"GitHub",
	"FreeCodeCamp",
	"Oracle",
] as const;

type Filter = "All" | (typeof PRIMARY_ISSUERS)[number] | "Other";

const ITEMS_PER_PAGE = 9;
const AUTO_ROTATE_INTERVAL = 8000;

function formatDate(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function CertificationsSection() {
	const sectionRef = useRef<HTMLElement>(null);
	const [filter, setFilter] = useState<Filter>("All");

	const filtered = useMemo(() => {
		if (filter === "All") return certifications;
		if (filter === "Other") {
			return certifications.filter(
				(c) =>
					!PRIMARY_ISSUERS.includes(
						c.issuer as (typeof PRIMARY_ISSUERS)[number],
					),
			);
		}
		return certifications.filter((c) => c.issuer === filter);
	}, [filter]);

	const issuerCounts = useMemo(() => {
		const counts: Record<string, number> = { All: certifications.length };
		for (const issuer of PRIMARY_ISSUERS) {
			counts[issuer] = certifications.filter((c) => c.issuer === issuer).length;
		}
		counts.Other = certifications.filter(
			(c) =>
				!PRIMARY_ISSUERS.includes(c.issuer as (typeof PRIMARY_ISSUERS)[number]),
		).length;
		return counts;
	}, []);

	const {
		currentPage,
		totalPages,
		currentItems,
		nextPage,
		prevPage,
		goToPage,
		stopAutoRotate,
		isAutoRotating,
	} = useCarousel(filtered, ITEMS_PER_PAGE, AUTO_ROTATE_INTERVAL);

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

	// Reset to first page on filter change
	useEffect(() => {
		if (currentPage !== 0) goToPage(0);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filter]);

	const filters: Filter[] = ["All", ...PRIMARY_ISSUERS, "Other"];

	return (
		<section
			ref={sectionRef}
			id="certifications"
			className="py-20 sm:py-28 px-4 sm:px-6"
		>
			<div className="max-w-6xl mx-auto">
				<div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
					<div className="max-w-3xl">
						<p className="animate-on-scroll opacity-0 eyebrow mb-4">
							Certifications
						</p>
						<h2
							className="animate-on-scroll opacity-0 display-lg mb-4"
							style={{ animationDelay: "100ms" }}
						>
							{certifications.length}+ industry-recognized credentials.
						</h2>
						<p
							className="animate-on-scroll opacity-0 lede"
							style={{ animationDelay: "200ms" }}
						>
							{issuerCounts.GitHub}x GitHub, {issuerCounts.Microsoft}x
							Microsoft, {issuerCounts.Google}x Google, {issuerCounts.AWS}x AWS,
							plus Oracle, Cisco, Salesforce, and more.
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

				<div
					role="tablist"
					aria-label="Filter by issuer"
					className="flex flex-wrap gap-2 mb-8"
				>
					{filters.map((f) => {
						const active = f === filter;
						return (
							<button
								key={f}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => {
									stopAutoRotate();
									setFilter(f);
								}}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-medium transition-all",
									active
										? "bg-foreground text-background"
										: "bg-gray-50 text-muted-foreground hover:bg-gray-100",
								)}
							>
								{f}
								<span
									className={cn(
										"text-[11px] font-semibold tabular-nums",
										active ? "text-background/70" : "text-muted-foreground/70",
									)}
								>
									{issuerCounts[f]}
								</span>
							</button>
						);
					})}
				</div>

				<div className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
						{currentItems.map((cert, index) => (
							<Link
								href={cert.link || "#"}
								target={cert.link ? "_blank" : undefined}
								rel={cert.link ? "noopener noreferrer" : undefined}
								key={`${cert.id}-${currentPage}-${filter}`}
								className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors group"
								style={{
									animation: "fadeIn 0.3s ease forwards",
									animationDelay: `${index * 25}ms`,
									opacity: 0,
								}}
							>
								<div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
									<Image
										src={"/certification/logo/" + cert.logo}
										alt={cert.issuer}
										width={36}
										height={36}
										className="w-5 h-5 object-contain"
									/>
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-[var(--color-blue)] transition-colors">
										{cert.title}
									</h3>
									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<span className="truncate">{cert.issuer}</span>
										<span className="text-muted-foreground/40">·</span>
										<span className="shrink-0 tabular-nums">
											{formatDate(cert.date)}
										</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>

				<CarouselDots
					currentPage={currentPage}
					totalPages={totalPages}
					onGoToPage={goToPage}
					onUserInteraction={stopAutoRotate}
					className="mt-8"
				/>
			</div>
		</section>
	);
}
