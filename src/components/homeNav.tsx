import {
	FaAward,
	FaBuilding,
	FaCertificate,
	FaHome,
	FaRocket,
	FaStar,
} from "react-icons/fa";

interface NavLink {
	name: string;
	href: string;
	icon: React.ReactNode;
}

export const homeNavLinks: NavLink[] = [
	{
		name: "Home",
		href: "#home",
		icon: <FaHome className="h-6 w-6" />,
	},
	{
		name: "Projects",
		href: "#projects",
		icon: <FaRocket className="h-6 w-6" />,
	},
	{
		name: "Certifications",
		href: "#certifications",
		icon: <FaCertificate className="h-6 w-6" />,
	},
	{
		name: "Affiliations",
		href: "#affiliations",
		icon: <FaBuilding className="h-6 w-6" />,
	},
	{
		name: "Recommendations",
		href: "#recommendations",
		icon: <FaStar className="h-6 w-6" />,
	},
	{
		name: "Awards",
		href: "#awards",
		icon: <FaAward className="h-6 w-6" />,
	},
	{
		name: "Contact",
		href: "#contact",
		icon: <FaAward className="h-6 w-6" />,
	},
];
