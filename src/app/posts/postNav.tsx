import { FaHome, FaBlog } from "react-icons/fa";

interface NavLink {
	name: string;
	href: string;
	icon: React.ReactNode;
}

export const postNavLinks: NavLink[] = [
	{
		name: "Home",
		href: "/",
		icon: <FaHome className="h-6 w-6" />,
	},
	{
		name: "Blog",
		href: "/posts",
		icon: <FaBlog className="h-6 w-6" />,
	},
];
