import { motion } from "framer-motion";
import Image from "next/image";
import { Certification } from "../../types/certification";

export function CertificationCard({
	certification,
}: {
	certification: Certification;
}) {
	return (
		<motion.div
			whileHover={{ y: -5 }}
			transition={{ duration: 0.2 }}
			className="bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200 border border-border h-full"
		>
			<a
				href={certification.link}
				target="_blank"
				rel="noopener noreferrer"
				className="block h-full p-4"
			>
				<div className="flex flex-col h-full">
					<div className="flex items-center space-x-4 mb-4">
						<Image
							src={"/certificates/logo/" + certification.companyLogo}
							alt={`${certification.company} logo`}
							width={40}
							height={40}
							className="rounded-sm"
						/>
						<div>
							<h3 className="text-sm font-medium leading-none mb-1">
								{certification.name}
							</h3>
							<p className="text-xs text-muted-foreground">
								{certification.company}
							</p>
						</div>
					</div>
					<div className="mt-auto flex justify-between items-center text-xs text-muted-foreground">
						<p>
							Received:{" "}
							{new Date(certification.receivedDate).toLocaleDateString()}
						</p>
						<span className="text-primary">View →</span>
					</div>
				</div>
			</a>
		</motion.div>
	);
}
