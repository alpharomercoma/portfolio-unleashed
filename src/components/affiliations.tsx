import Image from "next/image";
const affiliations = [
	{ name: "FEU Tech", logo: "/affiliations/fit.png" },
	{ name: "FEU Tech ACM", logo: "/affiliations/fit_acm.png" },
	{ name: "GitHub", logo: "/affiliations/github.png" },
	{
		name: "GitHub Campus Expert",
		logo: "/affiliations/github_campus_expert.png",
	},
	{
		name: "GitHub Campus Expert Philippines",
		logo: "/affiliations/github_campus_expert_philippines.png",
	},
	{ name: "Google Cloud Platform", logo: "/affiliations/google_cloud.png" },
	{ name: "TPU Research Cloud", logo: "/affiliations/trc.png" },
	{ name: "FEU Tech GDSC", logo: "/affiliations/fit_gdsc.png" },
	{
		name: "Google Cloud Manila",
		logo: "/affiliations/google_cloud_manila.png",
	},
	{ name: "Amazon Security User Group", logo: "/affiliations/awssug.jpg" },
	{ name: "AI Republic", logo: "/affiliations/airepublic.png" },
	{ name: "ULAP.org", logo: "/affiliations/ulap.png" },
	{ name: "Logrocket", logo: "/affiliations/logrocket.png" },
	{ name: "IEEE", logo: "/affiliations/ieee.png" },
	{ name: "IEEE Computer Society", logo: "/affiliations/ieee_cs.png" },
	{
		name: "Analytics & Artificial Intelligence Association of the Philippines",
		logo: "/affiliations/aap.png",
	},
];

function Affiliations() {
	return (
		<section className="py-12 bg-gray-50" id="affiliations">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold mb-10 text-center">
					Professional Affiliations
				</h2>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
					{affiliations.map((affiliation) => (
						<div
							key={affiliation.name}
							className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm transition-transform hover:scale-105"
						>
							<Image
								alt="Logo"
								className="w-full h-full object-contain object-center transition-all group-hover:scale-110"
								height={400}
								src={affiliation.logo}
								style={{
									aspectRatio: "220/100",
									objectFit: "contain",
								}}
								width={400}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Affiliations;
