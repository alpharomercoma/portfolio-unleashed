"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Image from "next/image";

interface Project {
    title: string;
    description: string;
    image: string;
    codeUrl?: string;
    demoUrl?: string;
    projectUrl?: string;
}

const projects: Record<string, Project[]> = {
    "Software Engineering": [
        {
            title: "FEU Tech ACMX",
            description: "The official and premier cross-platform application of The FEU Tech ACM, serving 4,000+ Tamaraw students and automating 90,000+ undertakings annually. Released on major stores including Google Play Store, Microsoft Store, Xiaomi GetApps, & Huawei App Gallery",
            image: "/projects/swe/acmx.png",
            codeUrl: "https://github.com/feutechacmx/acmx",
            demoUrl: "https://acmx.vercel.app"
        },
        {
            title: "Para Po!",
            description: "Para Po! is an award-winning project recognized as a finalist and recipient of the GlobalCo Special Award at the Philippine Junior Data Science Challenge in November 2024.",
            image: "/projects/swe/para-po.png",
            codeUrl: "https://github.com/alpharomercoma/para-po",
            demoUrl: "https://para-po-beta.vercel.app"
        },
        {
            title: "Project NATURE of NASA '24",
            description: "An interactive 3D Globe/Map storytelling platform aiming to educate about factors that significantly contribute to climate change by simplifying the data available on the U.S. Greenhouse Gas Center website and other sources.",
            image: "/projects/swe/project-nature.png",
            codeUrl: "https://github.com/FEUTechACM/NASA-hackathon-2024",
            demoUrl: "https://projectnature.vercel.app"
        },
        {
            title: "Markdown Studio",
            description: "Modern cross-platform note-taking & blogging application with 200+ users on Google Play Store and Microsoft Store",
            image: "/projects/swe/mdstudio.png",
            codeUrl: "https://github.com/alpharomercoma/mdstudio",
            demoUrl: "https://markdownstudio.vercel.app"
        },
        {
            title: "Kape ni Rab",
            description: "Kape ni Rab! was the champion website developed in just two days during the Codetober: Web Development Competition hosted by the FEU Tech Alliance of Information Technology Students in October 2024.",
            image: "/projects/swe/kape-ni-rab.png",
            codeUrl: "https://github.com/alpharomercoma/kape",
            demoUrl: "https://alpharomercoma.github.io/kape"
        },
        {
            title: "MyMNHS",
            description: "MyMNHS was the unofficial platform of Meycauayan National High School, completed with a real-time chat feature, announcements, and forums",
            image: "/projects/swe/mymnhs.png",
            codeUrl: "https://github.com/alpharomercoma/mymnhs",
            demoUrl: "https://mymnhs.vercel.app"
        },
    ],
    "Machine Learning": [
        {
            title: "AceRouter",
            description: "AceRouter is an AI-powered chat agent that helps delivery riders in the Philippines optimize routes, communicate with delivery points, and maximize their earnings efficiently.",
            image: "/projects/mle/acerouter.png",
            codeUrl: "https://github.com/alpharomercoma/acerouter",
            demoUrl: "https://acerouter.vercel.app"
        },
        {
            title: "Mijikai News",
            description: "Mijikai news is a multilingual agent that leverages GPT-4 to provide a summary of news articles and a sentiment analysis of the content",
            image: "/projects/mle/mijikainews.png",
            codeUrl: "https://github.com/alpharomercoma/AI-Republic-Bootcamp/tree/master/day_3/ai-first-day-3-activity-4",
            demoUrl: "https://mijikainews.streamlit.app/"
        },
        {
            title: "VerseForge",
            description: "An innovative AI-powered music mix and composition platform to generate music based on user preferences",
            image: "/projects/mle/verseforge.png",
            codeUrl: "https://github.com/alpharomercoma/AI-Republic-Bootcamp/tree/master/day_3/ai-first-day-3-activity-5-6",
            demoUrl: "https://verseforge.streamlit.app"
        },
        {
            title: "Programming Q&A with fine-tuned Gemma",
            description: "An optimized and fine-tuned gemma 2b model specialized in answering programming-related questions in Java and PHP",
            image: "/projects/mle/gemma.png",
            codeUrl: "https://github.com/alpharomercoma/AI-Republic-Bootcamp/blob/master/day_2/3-Finetuning-Gemma-2b.ipynb",
            demoUrl: "https://huggingface.co/alpharomercoma/gemma-2b-instruct-ft-coding-interview"
        },
    ],
    "Project Management": [
        {
            title: "ACM x GCP",
            description: "Secured a ₱10.2 million deal with Google Cloud Platform for upskilling of 500 members for 12 months",
            image: "/projects/pm/acm-gcp.png",
            projectUrl: "https://cloud.google.com/consulting/portfolio/google-cloud-skills-boost-for-organizations"
        },
        {
            title: "NASA Collaboration",
            description: "Coordinated 70 members to receive official limited edition NASA certificates by completing the Open Science curriculum",
            image: "/projects/pm/nasa.jpg",
            projectUrl: "https://www.linkedin.com/posts/alpharomercoma_nasa-tops-openscience-activity-7259239998749573120-AqbM"
        },
        {
            title: "Project ACMX",
            description: "Led a 10-man team of the organization's software development team",
            image: "/projects/pm/acmx.png",
            projectUrl: ""
        },
        {
            title: "Google Philippines CTO Connect",
            description: "Managed the successful launch of a SaaS product from inception to market",
            image: "/projects/pm/google.jpg",
            projectUrl: "https://www.linkedin.com/posts/alpharomercoma_feutechacm-acmbeyondcampus-initiative-activity-7213069145796489216-9FhR?utm_source=share&utm_medium=member_desktop"
        },
        {
            title: "Microsoft Learn with the MVPs",
            description: "Scaled development team from 10 to 50 members while maintaining productivity",
            image: "/projects/pm/microsoft.jpg",
            projectUrl: "https://www.linkedin.com/posts/ziggyzulueta_techlearning-networking-professionaldevelopment-ugcPost-7252980251926937600-UflV"
        },
        {
            title: "AWS Modern Java Development",
            description: "Led the agile transformation for a team of 50+ developers",
            image: "/projects/pm/aws.jpg",
            projectUrl: "https://www.linkedin.com/posts/jugph_java-java-devconmanila-ugcPost-7216060061024931840-fJKQ"
        },
    ],
    "Research": [
        {
            title: "Augmenting Multimodal Deep Learning with Attention Layers for Recognizing Addictive Neurodegenerative Content",
            description: "A novel thesis on the modern phenomenon called brain rot and the development of a multimodal deep learning model specialized in recognizing addictive neurodegenerative content",
            image: "/projects/research/skibidi.png",
            projectUrl: "https://docs.google.com/document/d/1T0g-GNV7Zt2lRcN037KzcMlSd-tspfq3/edit#heading=h.nzicxuemjomp"
        },
        {
            title: "Fireguard: A Data-driven Community-based Global Fire Management System",
            description: "NASA Hackathon's award-winning data-driven, community-based global fire management system that leverages satellite-derived active fire data to address fire incidents across the Philippines",
            image: "/projects/research/fireguard.png",
            projectUrl: "https://www.spaceappschallenge.org/2023/find-a-team/feu-tech-acm/?tab=project"
        },
    ],
};

function Projects() {

    return (
        <section id="projects" className="py-12">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-10 text-center">Projects</h2>
                <Tabs defaultValue="Software Engineering" className="w-full">
                    <TabsList className="flex items-stretch w-full justify-around flex-wrap h-auto space-y-1 mb-6 sm:mb-8 rounded-lg p-1">
                        {Object.keys(projects).map((category) => (
                            <TabsTrigger key={category} value={category} className={`px-4 py-2 rounded-lg font-bold cursor-pointer}`}>
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {Object.entries(projects).map(([category, categoryProjects]) => (
                        <TabsContent key={category} value={category}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryProjects.map((project, index) => (
                                    <motion.div
                                        key={project.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    <p className="text-xl font-bold group-hover:text-primary">
                                                        {project.title}
                                                    </p>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Image
                                                    alt={project.title}
                                                    className="rounded-lg aspect-video w-full overflow-hidden object-cover transition-all duration-300 group-hover:scale-105"
                                                    height={365}
                                                    src={project.image}
                                                    width={600}
                                                />
                                                <CardDescription>
                                                    <p className="mt-4 text-sm text-gray-500">{project.description}</p>
                                                </CardDescription>
                                            </CardContent>
                                            <CardFooter className="flex justify-between">
                                                {
                                                    project.codeUrl &&
                                                    <Button asChild variant="outline">
                                                        <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">View Code</a>
                                                    </Button>
                                                }
                                                <Button asChild>
                                                    {
                                                        project.projectUrl ?
                                                            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">View Project</a>
                                                            :
                                                            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">View Demo</a>
                                                    }
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </section>
    );
}


export default Projects;