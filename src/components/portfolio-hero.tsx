import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cloud, Code, ExternalLink, Github, Globe2, HeartHandshake, Linkedin, Mail, MapPin, Play, School2, Store, Zap } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";

export default function PortfolioHero() {
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
      <div className="relative mx-auto max-w-7xl px-4 pt-40 lg:pt-80 pb-12 sm:px-6 lg:px-8">
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
                <p className="mt-2 text-xl text-muted-foreground text-balance">Software Engineer | Machine Learning Engineer</p>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    Multilingual
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    ML Expert
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    Full Stack Dev
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Cloud className="h-3 w-3" />
                    Cloud Architect
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <HeartHandshake className="h-3 w-3" />
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
              <div className="mt-6 flex flex-col sm:flex-row lg:flex-col justify-center gap-3 lg:justify-start">
                <Button asChild>
                  <Link href="mailto:alpharomercoma@proton.me">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Me
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="https://flowcv.com/resume/p5r0itrtfm" target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Resume
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex items-center gap-4 p-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">Seattle, Washington, United States</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <Github className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">GitHub Campus Expert</p>
                <p className="text-sm text-muted-foreground">5x GitHub, 1x Oracle, Salesforce, & Microsoft</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-4">
              <School2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">FEU Institute of Technology</p>
                <p className="text-sm text-muted-foreground">Computer Science</p>
              </div>
            </Card>
          </div>

          {/* Social Links */}
          <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SocialCard
              icon={<Github className="h-5 w-5" />}
              name="GitHub"
              stats="1000+ Contributions"
              url="https://github.com/alpharomercoma"
            />
            <SocialCard
              icon={<Linkedin className="h-5 w-5" />}
              name="LinkedIn"
              stats="2400+ Followers"
              url="https://linkedin.com/in/alpharomercoma"
            />
            <SocialCard
              icon={<Play className="h-5 w-5" />}
              name="Google Play Store"
              stats="400+ Downloads"
              url="https://play.google.com/store/apps/dev?id=8475868964031287315"
            />
            <SocialCard
              icon={<Store className="h-5 w-5" />}
              name="Microsoft Store"
              stats="100+ Downloads"
              url="https://apps.microsoft.com/search/publisher?name=Alpha+Romer+Coma"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialCard({ icon, name, stats, url }: { icon: React.ReactNode; name: string; stats: string; url: string; }) {
  return (
    <Link href={url}>
      <Card className="flex items-center gap-4 p-4">
        {icon}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{stats}</p>
        </div>
      </Card>
    </Link>
  );
}
