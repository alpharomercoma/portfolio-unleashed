import { FaGithub, FaGooglePlay, FaLinkedin, FaMicrosoft, FaSlack, FaYoutube } from "react-icons/fa";
interface Social {
    name: string;
    link: string;
    icon: React.ReactNode;
}

export const socials: Social[] = [
    {
        name: "GitHub",
        link: "https://github.com/alpharomercoma",
        icon: <FaGithub className="h-6 w-6" />,
    },
    {
        name: "Slack",
        link: "https://comadevelopmentllc.slack.com/team/U055R478A2G",
        icon: <FaSlack className="h-6 w-6" />,
    },
    {
        name: "LinkedIn",
        link: "https://www.linkedin.com/in/alpharomercoma/",
        icon: <FaLinkedin className="h-6 w-6" />,
    },
    {
        name: "Microsoft Store",
        link: "https://apps.microsoft.com/search/publisher?name=Alpha+Romer+Coma",
        icon: <FaMicrosoft className="h-6 w-6" />,
    },
    {
        name: "Google Play Store",
        link: "https://play.google.com/store/apps/developer?id=Alpha+Romer+Coma",
        icon: <FaGooglePlay className="h-6 w-6" />,
    },
    {
        name: "YouTube",
        link: "https://www.youtube.com/@alphacoma18",
        icon: <FaYoutube className="h-6 w-6" />,
    },
];