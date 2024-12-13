"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Award {
	title: string;
	issuedBy: string;
	issuedOn: string;
	imageUrl: string;
	type: "technical" | "language";
}

const awards: Award[] = [
	{
		title:
			"Philippine Junior Data Science Challenge Finalist & GlobalCo Special Awards",
		issuedBy: "UP Data Science Society",
		issuedOn: "November 2024",
		imageUrl: "/awards/pjdsc.jpg",
		type: "technical",
	},
	{
		title: "Codetober: Web Development Champions",
		issuedBy: "FEU Tech Alliance of Information Technology Students",
		issuedOn: "October 2024",
		imageUrl: "/awards/codetober.png",
		type: "technical",
	},
	{
		title: "Galactic Problem Solver '24",
		issuedBy: "NASA Space Apps Challenge",
		issuedOn: "October 2024",
		imageUrl: "/awards/nasa_solver_24.png",
		type: "technical",
	},
	{
		title: "Algolympics 2024 Finalist",
		issuedBy: "UP Diliman ACM Student Chapter",
		issuedOn: "January 2024",
		imageUrl: "/awards/algolympics.png",
		type: "technical",
	},
	{
		title: "Top 1% of 500K+ WakaTime Developers 2023",
		issuedBy: "WakaTime",
		issuedOn: "January 2024",
		imageUrl: "/awards/wakatime.png",
		type: "technical",
	},
	{
		title: "Space Apps 2023 Global Nominee",
		issuedBy: "NASA Space Apps Challenge",
		issuedOn: "October 2023",
		imageUrl: "/awards/nasa_nominee_23.png",
		type: "technical",
	},
	{
		title: "Galactic Problem Solver '23",
		issuedBy: "NASA Space Apps Challenge",
		issuedOn: "October 2023",
		imageUrl: "/awards/nasa_solver_23.png",
		type: "technical",
	},
	{
		title: "President's Scholar with High Honors",
		issuedBy: "FEU Institute of Technology",
		issuedOn: "August 2022",
		imageUrl: "/awards/fit_scholarship.png",
		type: "technical",
	},
	{
		title: "Nihongojin Across the Philippines Essay Luzon Winner",
		issuedBy: "Japan Foundation",
		issuedOn: "November 2023",
		imageUrl: "/awards/nihongojin.png",
		type: "language",
	},
	{
		title: "Nihongo Stories Featured Learner",
		issuedBy: "Japan Foundation",
		issuedOn: "August 2023",
		imageUrl: "/awards/nihongo_stories.png",
		type: "language",
	},
	{
		title: "Japanese Language Proficiency Test N3",
		issuedBy: "Japan Foundation",
		issuedOn: "February 2023",
		imageUrl: "/awards/jlpt_n3.png",
		type: "language",
	},
	{
		title: "Mandarin Chinese YCT Level 2",
		issuedBy: "Confucius Institute",
		issuedOn: "November 2017",
		imageUrl: "/awards/yct2.jpg",
		type: "language",
	},
];

function HonorsAndAwards() {
	const [currentPage, setCurrentPage] = useState(0);
	const [activeTab, setActiveTab] = useState<"technical" | "language">(
		"technical",
	);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const filteredAwards = awards.filter((award) => award.type === activeTab);
	const itemsPerPage = isMobile ? 3 : 6;
	const totalPages = Math.ceil(filteredAwards.length / itemsPerPage);

	const nextPage = () => {
		setCurrentPage((prevPage) =>
			prevPage === totalPages - 1 ? 0 : prevPage + 1,
		);
	};

	const prevPage = () => {
		setCurrentPage((prevPage) =>
			prevPage === 0 ? totalPages - 1 : prevPage - 1,
		);
	};

	const currentAwards = filteredAwards.slice(
		currentPage * itemsPerPage,
		(currentPage + 1) * itemsPerPage,
	);

	return (
		<section className="py-12" id="awards">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold mb-10 text-center">
					Honors and Awards
				</h2>
				<Tabs
					value={activeTab}
					onValueChange={(value) => {
						setActiveTab(value as "technical" | "language");
						setCurrentPage(0);
					}}
				>
					<TabsList className="flex items-stretch w-full justify-around flex-wrap h-auto space-y-1 mb-6 sm:mb-8 rounded-lg p-1">
						<TabsTrigger value="technical" className="flex-1">
							Technical Awards
						</TabsTrigger>
						<TabsTrigger value="language" className="flex-1">
							Language Awards
						</TabsTrigger>
					</TabsList>
					<TabsContent value="technical">
						<AwardsGrid awards={currentAwards} />
					</TabsContent>
					<TabsContent value="language">
						<AwardsGrid awards={currentAwards} />
					</TabsContent>
				</Tabs>
				<div className="flex justify-between items-center mt-8">
					<button
						onClick={prevPage}
						disabled={currentPage === 0}
						className="flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors duration-200"
					>
						<FaChevronLeft size={20} className="mr-2" />
						<span className="hidden sm:inline">Previous</span>
					</button>
					<span className="text-sm font-medium">
						Page {currentPage + 1} of {totalPages}
					</span>
					<button
						onClick={nextPage}
						disabled={currentPage === totalPages - 1}
						className="flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors duration-200"
					>
						<span className="hidden sm:inline">Next</span>
						<FaChevronRight size={20} className="ml-2" />
					</button>
				</div>
			</div>
		</section>
	);
}

interface AwardsGridProps {
	awards: Award[];
}

function AwardsGrid({ awards }: AwardsGridProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{awards.map((award, index) => (
				<div
					key={index}
					className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
				>
					<div className="relative w-full pt-[56.25%]">
						<Image
							src={award.imageUrl}
							alt={award.title}
							layout="fill"
							objectFit="cover"
							className="absolute top-0 left-0"
						/>
					</div>
					<div className="p-4">
						<h3 className="text-lg font-semibold mb-2 line-clamp-2">
							{award.title}
						</h3>
						<p className="text-sm text-gray-600 mb-1">
							Issued by: {award.issuedBy}
						</p>
						<p className="text-sm text-gray-500">Issued on: {award.issuedOn}</p>
					</div>
				</div>
			))}
		</div>
	);
}

export default HonorsAndAwards;
