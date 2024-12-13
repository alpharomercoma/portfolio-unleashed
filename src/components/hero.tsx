import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { FaCloud, FaCode, FaEnvelope, FaExternalLinkAlt, FaGithub, FaGlobe, FaHeart, FaMapPin, FaUniversity } from "react-icons/fa";
import { FaBoltLightning } from "react-icons/fa6";
import { socials } from "./Socials";
function Hero() {
  return (
    <div className="relative w-full">
      {/* Background Image Section */}
      <div className="absolute inset-0 h-[400px] w-full overflow-hidden">
        <div className="relative h-full w-full">
          <Image
            src="/hero/bg.jpg"
            alt="Background collage"
            className="object-cover"
            fill
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-28 lg:pt-80 pb-12 sm:px-6 lg:px-8">
        <div className="relative pb-8">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left">
            {/* Profile Picture */}
            <div className="mb-6 h-40 w-40 overflow-hidden rounded-full border-4 border-background shadow-xl lg:mb-0 lg:mr-8">
              <Image
                src="/hero/alpha.jpg"
                alt="Profile picture"
                className="object-cover"
                width={160}
                height={160}
                priority
              />
            </div>

            {/* Name, Title, Description, and Buttons Section */}
            <div className="flex-1 lg:flex lg:justify-between lg:gap-8">
              <div className="lg:flex-1">
                <h1 className="text-3xl font-bold sm:text-4xl">Alpha Romer Coma</h1>
                <p className="mt-2 text-xl text-muted-foreground text-balance">Software Engineer && Machine Learning Engineer</p>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaGlobe className="h-3 w-3" />
                    Multilingual
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaBoltLightning className="h-3 w-3" />
                    ML Expert
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaCode className="h-3 w-3" />
                    Full Stack Dev
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaCloud className="h-3 w-3" />
                    Cloud Architect
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FaHeart className="h-3 w-3" />
                    Open Source Contributor
                  </Badge>
                </div>

                {/* Bio Section */}
                <div className="mt-6 max-w-2xl mx-auto lg:mx-0">
                  <p className="text-muted-foreground">
                    Building the Change of Tomorrow | Passionate about technology, innovation, and community. My goal is for the transcendence of AI towards sentience.
                  </p>
                </div>
              </div>

              {/* Action Buttons - Responsive Position */}
              <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row lg:flex-col justify-center gap-3 lg:justify-start">
                <Button asChild>
                  <Link href="mailto:alpharomercoma@proton.me">
                    <FaEnvelope className="mr-2 h-4 w-4" />
                    Contact Me
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="https://flowcv.com/resume/p5r0itrtfm" target="_blank">
                    <FaExternalLinkAlt className="mr-2 h-4 w-4" />
                    View Resume
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex items-center gap-4 p-4">
              <FaMapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">Seattle, Washington, United States</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <FaGithub className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">GitHub Campus Expert Philippines</p>
                <p className="text-sm text-muted-foreground">5x GitHub, 1x Oracle, Salesforce, & Microsoft</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <FaUniversity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">FEU Institute of Technology</p>
                <p className="text-sm text-muted-foreground">Computer Science, Software Engineering</p>
              </div>
            </Card>
          </div>

          {/* Social Links */}
          <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {
              socials.map((social) => (
                <SocialCard
                  key={social.name}
                  icon={social.icon}
                  name={social.name}
                  stats={social.description}
                  url={social.link}
                />
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialCard({ icon, name, stats, url }: { icon: React.ReactNode; name: string; stats: string; url: string; }) {
  return (
    <a href={url} target="_blank">
      <Card className="flex items-center gap-4 p-4">
        {icon}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{stats}</p>
        </div>
      </Card>
    </a>
  );
}


export default Hero;