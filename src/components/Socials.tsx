import { FaGithub, FaGooglePlay, FaLinkedin, FaMicrosoft } from "react-icons/fa";
interface Social {
    name: string;
    link: string;
    icon: React.ReactNode;
    description: string;
}

export const socials: Social[] = [
    {
        name: "GitHub",
        link: "https://github.com/alpharomercoma",
        icon: <FaGithub className="h-6 w-6" />,
        description: "1000+ Contributions",
    },
    {
        name: "LinkedIn",
        link: "https://www.linkedin.com/in/alpharomercoma/",
        icon: <FaLinkedin className="h-6 w-6" />,
        description: "2400+ Followers",
    },
    {
        name: "Google Play Store",
        link: "https://play.google.com/store/apps/developer?id=Alpha+Romer+Coma",
        icon: <FaGooglePlay className="h-6 w-6" />,
        description: "400+ Downloads",
    },
    {
        name: "Microsoft Store",
        link: "https://apps.microsoft.com/search/publisher?name=Alpha+Romer+Coma",
        icon: <FaMicrosoft className="h-6 w-6" />,
        description: "100+ Downloads",
    },
];