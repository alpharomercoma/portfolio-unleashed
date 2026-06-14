// Generates data/talks.seed.json from the normalized, deck-enriched talk list
// below, and (when UPSTASH_REDIS_REST_URL/TOKEN are set) seeds Upstash Redis.
//
// The CSV (data/talks.csv) is event-rows; here they are normalized into the
// talk-centric model (one talk -> many events). Abstract / outline / key
// takeaways were drafted from the owner's actual Canva decks where available
// (read via the Canva tools). Talks without a readable deck are flagged
// needsReview:true so they can be refined in the admin.
//
// Usage: node scripts/seed-talks.mjs   (or: pnpm seed-talks)
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const slugify = (s) =>
	s
		.toLowerCase()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);

const canva = (id) => `https://www.canva.com/design/${id}/view`;

// One entry per talk. events[] carries each delivery.
const TALKS = [
	{
		title: "De-mystifying PyTorch for ASICs",
		tagline:
			"When, and why, to move your model development onto AI accelerators.",
		type: "Talk",
		category: "Accelerated Computing",
		level: "Intermediate",
		durationMinutes: 30,
		language: "English",
		featured: true,
		tags: ["PyTorch", "H100", "TPU", "Trainium", "ASICs", "Benchmarking"],
		abstract:
			"A practitioner's benchmark study of training image-recognition and text-generation models across four accelerator classes: 1x H100 (RunPod), 8x H100 (Nebius), Google TPU v6e-8, and AWS Trainium1 32xlarge. The talk demystifies when a custom ASIC actually pays off versus an NVIDIA GPU, and how PyTorch maps onto each backend.",
		outline: [
			"Why accelerators, and the ASIC landscape (GPU, TPU, Trainium)",
			"The benchmark setup across four platforms",
			"Image recognition results and trade-offs",
			"Text generation results and trade-offs",
			"PyTorch on each backend: portability and gotchas",
			"When (and when not) to move to an ASIC",
		],
		keyTakeaways: [
			"ASIC value depends on workload shape, not headline FLOPS",
			"PyTorch portability across backends is better than most assume",
			"Cost-per-token and availability often matter more than peak speed",
		],
		primarySlideUrl: canva("DAGsYa9Ivhw"),
		needsReview: true,
		events: [
			{
				eventName: "PyTorch Conference Europe 2026",
				organizerName: "Linux Foundation",
				date: "2026-04-07",
				venue: "Station F, Paris, France",
				audienceSize: 100,
			},
			{
				eventName: "AI Study Group 2026",
				organizerName: "Data Engineering Pilipinas",
				date: "2026-05-09",
				venue: "Online",
				audienceSize: 20,
			},
		],
	},
	{
		title: "Foundations of Multimodal AI: Fusions, Architectures, and Beyond",
		tagline:
			"From the McGurk effect to modern vision-language models and how they fuse modalities.",
		type: "Talk",
		category: "AI & ML",
		level: "Advanced",
		durationMinutes: 120,
		language: "English",
		featured: true,
		tags: [
			"Multimodality",
			"VLM",
			"Fusion",
			"CLIP",
			"LLaVA",
			"BLIP-2",
			"Transformers",
		],
		abstract:
			"A deep technical tour of multimodal AI: what 'multimodal' really means, the fusion techniques (early, middle, late) that combine modalities, the architectural evolution from RNNs and CNNs to Transformers and modern vision-language models (CLIP, LLaVA, BLIP-2, Qwen2-VL), plus datasets, training, evaluation, and where the field is heading.",
		outline: [
			"What is multimodality (human-centered vs machine-centric)",
			"Fusion techniques: early, middle, and late fusion",
			"Architecture evolution: RNN, CNN, Transformer, ViT",
			"Large vision-language models: CLIP, LLaVA, BLIP-2, MiniGPT-4, InstructBLIP",
			"Datasets for alignment and instruction tuning",
			"Training, evaluation metrics, and MLLM benchmarks",
			"The future: reasoning, multilingual, mobile-first, RAG",
		],
		keyTakeaways: [
			"Fusion strategy (early/middle/late) is the core design decision",
			"A projection layer is what bridges a vision encoder to an LLM",
			"Benchmarks reveal a 'blind faith in text' failure mode in VLMs",
		],
		primarySlideUrl: canva("DAGsYa9Ivhw"),
		events: [
			{
				eventName: "Foundations of Multimodal AI",
				organizerName: "Data Engineering Pilipinas",
				date: "2025-07-14",
				venue: "Online",
				audienceSize: 40,
				slideUrl: canva("DAGsYa9Ivhw"),
			},
		],
	},
	{
		title: "Supercharge Your ML Research with Google's TPU Research Cloud",
		tagline:
			"Architecture, access, and training on TPU pods, backed by a $376K compute grant.",
		type: "Talk",
		category: "Accelerated Computing",
		level: "Advanced",
		durationMinutes: 30,
		language: "English",
		featured: true,
		tags: ["TPU", "Google Cloud", "TRC", "JAX", "ML Research"],
		abstract:
			"How to access and use Google's TPU Research Cloud to run serious ML research for free. Covers TPU pod architecture, how to apply for and use the TRC grant, and training workflows, illustrated with a thesis that ran on the equivalent of a ~$376,000 (₱21M) compute allocation.",
		outline: [
			"What TPUs are and how pods are structured",
			"Applying for and accessing TPU Research Cloud",
			"Cost math: why TRC is a research superpower",
			"Training workflows on TPU (JAX / PyTorch-XLA)",
			"Lessons from a grant-backed thesis",
		],
		keyTakeaways: [
			"TRC makes pod-scale compute accessible to students and researchers",
			"A v4-64 pod equivalent can represent ~$376K of compute",
			"Plan your data pipeline before you ever touch a pod",
		],
		primarySlideUrl: canva("DAGsYa9Ivhw"),
		needsReview: true,
		events: [
			{
				eventName: "DevFest 2025",
				organizerName: "GDG Cloud Manila",
				date: "2025-10-13",
				venue: "LaunchGarage",
				audienceSize: 120,
			},
			{
				eventName: "SOFTCON 2025",
				organizerName: "SOFTCON 2025",
				date: "2025-10-17",
				venue: "Online",
				audienceSize: 120,
			},
		],
	},
	{
		title: "Git and GitHub Foundations",
		tagline:
			"A hands-on path from your first commit to a confident GitHub workflow.",
		type: "Workshop",
		category: "Developer Tools",
		level: "Foundational",
		durationMinutes: 120,
		language: "English",
		featured: true,
		tags: ["Git", "GitHub", "Version Control", "Workshop", "Certification"],
		abstract:
			"A foundational, hands-on workshop on Git and GitHub: the core commands, the commit workflow, branching, pull requests, and the GitHub features that get you job-ready, including the path to the free-for-students GitHub Foundations certification and the Student Developer Pack.",
		outline: [
			"Git vs GitHub, and why version control matters",
			"Fundamental commands: init, add, commit, push, pull, clone",
			"Anatomy of a commit and .gitignore",
			"Branching, forking, merge vs rebase",
			"Pull requests and GitHub Flow",
			"Certification path and the Student Developer Pack",
		],
		keyTakeaways: [
			"A clean commit workflow is the foundation of collaboration",
			"GitHub Flow is a simple, CI/CD-friendly branching model",
			"Students can get GitHub Foundations certified for free",
		],
		primarySlideUrl: canva("DAGgCsmcztc"),
		events: [
			{
				eventName: "Revival X: Git Grimoire",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2025-01-24",
				venue: "FEU Institute of Technology",
				audienceSize: 30,
				slideUrl: canva("DAGSHoSgVYE"),
			},
			{
				eventName: "Get Ready to Git Started with GitHub",
				organizerName: "Polytechnic University of the Philippines",
				date: "2025-02-26",
				venue: "Online",
				audienceSize: 100,
				slideUrl: canva("DAGgCsmcztc"),
			},
			{
				eventName: "Let's Git Ready: From Commit to Career",
				organizerName: "Association of Computer Science Students - PNC",
				date: "2025-10-24",
				venue: "Online",
				audienceSize: 100,
			},
			{
				eventName: "Git and GitHub Workshop",
				organizerName: "JBECP, JRU Chapter",
				date: "2026-03-05",
				venue: "Jose Rizal University",
				audienceSize: 50,
			},
		],
	},
	{
		title: "Practical GitHub: Advanced Use Cases",
		tagline:
			"Branching strategies, Codespaces, Actions, and Copilot for real projects.",
		type: "Workshop",
		category: "Developer Tools",
		level: "Intermediate",
		durationMinutes: 120,
		language: "English",
		featured: false,
		tags: ["GitHub", "Actions", "Codespaces", "Copilot", "CI/CD"],
		abstract:
			"Beyond the basics: the GitHub features that level up personal and industry projects. Compares branching strategies, then works through real use cases of Codespaces, GitHub Actions (CI/CD), Copilot (editor, terminal, and web), and GitHub Models.",
		outline: [
			"Branching strategies compared (Git Flow, GitHub Flow, trunk-based)",
			"GitHub Codespaces: your free cloud dev environment",
			"GitHub Actions: client- and server-side validation, CI/CD",
			"GitHub Copilot in the editor, terminal, and on the web",
			"Bonus: GitHub Models for free AI experimentation",
		],
		keyTakeaways: [
			"Pick a branching strategy that matches team size and release cadence",
			"Actions + Husky catch problems before they reach main",
			"Codespaces gives you a disposable, full-power dev machine for free",
		],
		primarySlideUrl: canva("DAGfkJiDlTU"),
		events: [
			{
				eventName: "7th Software Engineering Day",
				organizerName: "Polytechnic University of the Philippines",
				date: "2025-05-06",
				venue: "Online",
				audienceSize: 150,
				slideUrl: canva("DAGfkJiDlTU"),
			},
		],
	},
	{
		title:
			"Open Source Series: Licensing, Version Control, Contributing, and Beyond",
		tagline: "Everything a first-time open-source contributor needs for Hacktoberfest.",
		type: "Workshop",
		category: "Open Source",
		level: "Intermediate",
		durationMinutes: 120,
		language: "English",
		featured: true,
		tags: ["Open Source", "Hacktoberfest", "Licensing", "Git", "GitHub"],
		abstract:
			"A Hacktoberfest workshop covering the full open-source on-ramp: what open source and Hacktoberfest are, software licensing, version control with Git and GitHub, and how to make your first contributions, plus the GitHub Student Developer Pack.",
		outline: [
			"Hacktoberfest and the open-source ecosystem",
			"Software licensing, what you can and can't do",
			"Version control with Git and GitHub",
			"Forking, branching, and contributing via pull requests",
			"Claiming the GitHub Student Developer Pack",
		],
		keyTakeaways: [
			"A license is what makes code legally usable, choose deliberately",
			"Contributing is a workflow (fork, branch, PR) anyone can learn",
			"The Student Developer Pack is a huge, free head start",
		],
		primarySlideUrl: canva("DAG3MtSllRU"),
		events: [
			{
				eventName: "Hacktoberfest 2025",
				organizerName: "PSITE DFCAMCLP-Chapter",
				date: "2025-10-30",
				venue: "National University Las Piñas",
				audienceSize: 100,
				slideUrl: canva("DAG3MtSllRU"),
			},
		],
	},
	{
		title: "Internship Employability: Resume, LinkedIn, GitHub, and Beyond",
		tagline: "An opinionated playbook for landing your first tech internship.",
		type: "Talk",
		category: "Career",
		level: "Foundational",
		durationMinutes: 60,
		language: "English",
		featured: false,
		tags: ["Career", "Resume", "LinkedIn", "Interviews", "Internship"],
		abstract:
			"A candid, opinionated session on getting hired: building an ATS-friendly resume, using LinkedIn and GitHub to stand out, navigating interview stages, reading company culture, negotiating an offer, and the mindset that ties it together.",
		outline: [
			"What a resume is actually for (ATS + the human)",
			"Resume do's and don'ts, with real examples rated",
			"LinkedIn and GitHub wins for job-seekers",
			"Interview stages and where to apply for the best odds",
			"Evaluating offers and negotiating (carefully)",
		],
		keyTakeaways: [
			"One page, single column, quantified bullets, clickable links",
			"A job is a two-way street, evaluate setup, growth, and alignment",
			"Direct applications beat one-click apply for response rate",
		],
		primarySlideUrl: canva("DAG3vgFTIRw"),
		events: [
			{
				eventName: "DEPLOY():",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2025-11-05",
				venue: "Online",
				audienceSize: 40,
				slideUrl: canva("DAG3vgFTIRw"),
			},
		],
	},
	{
		title: "Secure, Maintain, and Manage: Digital Essentials",
		tagline:
			"Cybersecurity, web maintenance, and project management for non-profits and teams.",
		type: "Talk",
		category: "Web Development",
		level: "Foundational",
		durationMinutes: 30,
		language: "English",
		featured: false,
		tags: ["Cybersecurity", "Web Maintenance", "Project Management", "SEO"],
		abstract:
			"Practical digital essentials built for the Virlanie Foundation: spotting AI-era cyber threats (phishing, deepfakes), keeping a website secure and performant (HTTPS, dependencies, analytics, SEO, hosting costs), and choosing a project-management approach (predictive, adaptive, hybrid).",
		outline: [
			"The 2025 AI-enabled threat landscape",
			"Spotting phishing, deepfakes, and social engineering",
			"Web maintenance: HTTPS, dependencies, analytics, SEO",
			"Cloud hosting costs compared (AWS / Azure / GCP)",
			"Project management approaches and tools",
		],
		keyTakeaways: [
			"Most breaches start with a human, not a zero-day",
			"Maintenance (updates, monitoring, SEO) is a continuous job",
			"Match the PM approach (waterfall/agile/hybrid) to the project",
		],
		primarySlideUrl: canva("DAGqHG1iTqc"),
		events: [
			{
				eventName: "BEYOND THE CODE: Concept-to-Code 2025 Part 3",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2025-06-13",
				venue: "FEU Institute of Technology",
				audienceSize: 20,
				slideUrl: canva("DAGqHG1iTqc"),
			},
		],
	},
	{
		title: "Demonstrating Websites and Internal Data Handling",
		tagline:
			"From the anatomy of a website to building and deploying one with AI in minutes.",
		type: "Workshop",
		category: "Web Development",
		level: "Intermediate",
		durationMinutes: 60,
		language: "English",
		featured: false,
		tags: ["Web Development", "AI", "v0", "Vercel", "No-code"],
		abstract:
			"A live workshop on how modern websites work and how fast they are to ship today: the structure of a website, static vs dynamic, internal data handling and hosting, then hands-on demos building and deploying a real site with website builders and AI tools (v0, Cursor).",
		outline: [
			"Parts and types of a website",
			"Internal data handling and where sites are hosted",
			"Traditional coding and hosting essentials",
			"Demo: building with website builders (Google Sites)",
			"Demo: building and deploying with AI (v0, Cursor)",
		],
		keyTakeaways: [
			"Static vs dynamic and hosting choices shape cost and effort",
			"AI tools can scaffold and deploy a real site in a few prompts",
			"Building your own web presence is more accessible than ever",
		],
		primarySlideUrl: canva("DAGbBFeOF8Y"),
		events: [
			{
				eventName: "BEYOND THE CODE: Concept-to-Code 2025 Part 1",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2025-01-07",
				venue: "FEU Institute of Technology",
				audienceSize: 20,
				slideUrl: canva("DAGbBFeOF8Y"),
			},
		],
	},
	{
		title: "Frontiers of Modern AI: Multimodality and Accelerated Computing",
		tagline: "A tour of the two frontiers defining where AI is going.",
		type: "Talk",
		category: "AI & ML",
		level: "Intermediate",
		durationMinutes: 120,
		language: "English",
		featured: false,
		tags: ["Multimodality", "Accelerated Computing", "TPU", "H100", "VLM"],
		abstract:
			"A guided tour of the two frontiers shaping modern AI: multimodal fusion architectures that combine text, vision, and audio, and the accelerator stack (H100, TPU v6e, Trainium) that makes training them possible.",
		outline: [
			"Why multimodality and accelerated computing are converging",
			"Multimodal fusion architectures in brief",
			"The accelerator stack: H100, TPU v6e, Trainium",
			"What this means for the next generation of models",
		],
		keyTakeaways: [
			"Capability gains now come from both data modality and hardware",
			"Knowing your accelerator options is a research advantage",
		],
		primarySlideUrl: canva("DAGsYa9Ivhw"),
		needsReview: true,
		events: [
			{
				eventName: "EDiTH Episode 9",
				organizerName: "FEU Institute of Technology",
				date: "2026-04-10",
				venue: "FEU Institute of Technology",
				audienceSize: 100,
			},
		],
	},
	{
		title: "Product Building with AI",
		tagline: "Going from idea to a shipped product using today's AI toolchain.",
		type: "Workshop",
		category: "AI & ML",
		level: "Advanced",
		durationMinutes: 100,
		language: "English",
		featured: true,
		tags: ["AI", "Product", "Prompt Engineering", "Vibe Coding", "Workshop"],
		abstract:
			"A hands-on workshop, delivered to ~700 attendees at the Philippine Innovation Conference, on building real products with AI: scoping an idea, prompting effectively, scaffolding with AI coding tools, and shipping a working prototype.",
		outline: [
			"Framing a product idea for AI-assisted building",
			"Prompting patterns that produce usable output",
			"Scaffolding and iterating with AI coding tools",
			"Shipping and what to watch out for",
		],
		keyTakeaways: [
			"Clear, constrained prompts beat clever ones",
			"AI shortens idea-to-prototype from weeks to hours",
			"You still own architecture, quality, and judgment",
		],
		needsReview: true,
		events: [
			{
				eventName: "Philippine Innovation Conference 2025",
				organizerName: "OpenVerse",
				date: "2025-11-21",
				venue: "University of Batangas",
				audienceSize: 700,
			},
		],
	},
	{
		title: "GitHub Universe '25 Recap: AI Edition",
		tagline: "The launches from GitHub Universe 2025, unpacked for builders.",
		type: "Talk",
		category: "Developer Tools",
		level: "Intermediate",
		durationMinutes: 30,
		language: "English",
		featured: false,
		tags: ["GitHub", "Copilot", "AI", "GitHub Models"],
		abstract:
			"A fast recap of GitHub Universe 2025's AI launches, delivered for the Microsoft Azure Community: agentic Copilot, GPT-powered code review, and the GitHub Models platform, and what they mean for everyday development.",
		outline: [
			"What's new from GitHub Universe 2025",
			"Agentic Copilot and the coding agent",
			"GPT-powered code review",
			"The GitHub Models platform",
		],
		keyTakeaways: [
			"Copilot is moving from autocomplete to autonomous agent",
			"Code review is becoming an AI-assisted workflow",
			"GitHub Models makes trying frontier models free and simple",
		],
		needsReview: true,
		events: [
			{
				eventName: "az:Repo: The Code and Cloud Agentic Workshop",
				organizerName: "Microsoft Azure Community",
				date: "2025-11-14",
				venue: "Microsoft Office Philippines",
				audienceSize: 100,
			},
		],
	},
	{
		title: "G-Trends: A Developer's Guide to Google's Next-Gen Toolkit",
		tagline: "The Google developer tools powering the next tech era.",
		type: "Talk",
		category: "Developer Tools",
		level: "Intermediate",
		durationMinutes: 30,
		language: "English",
		featured: false,
		tags: ["Google", "Gemini", "Developer Tools", "Cloud"],
		abstract:
			"A guide to Google's next-generation developer toolkit and how to fold it into your workflow, from Gemini and AI Studio to the wider Google Cloud and developer ecosystem.",
		outline: [
			"The shape of Google's current developer toolkit",
			"Gemini and AI Studio for builders",
			"Where Google Cloud fits",
			"Putting it together in a real workflow",
		],
		keyTakeaways: [
			"Google's toolkit is increasingly AI-first",
			"Free tiers make most of it accessible to students",
		],
		needsReview: true,
		events: [
			{
				eventName: "InSession 2025",
				organizerName: "Google Developer Group on Campus - TUP Manila",
				date: "2025-11-06",
				venue: "TUP Manila",
				audienceSize: 100,
			},
		],
	},
	{
		title: "Online Safety in the Age of AI",
		tagline: "Staying safe as a student when AI is in every classroom and feed.",
		type: "Talk",
		category: "AI & ML",
		level: "Foundational",
		durationMinutes: 60,
		language: "English",
		featured: false,
		tags: ["AI Safety", "Cybersecurity", "Students", "Prompt Injection"],
		abstract:
			"Navigating AI in the classroom and online: prompt injection, data leakage, deepfakes, and the practical safety habits students should adopt early.",
		outline: [
			"How AI changes the online-safety picture",
			"Prompt injection and data leakage, explained simply",
			"Deepfakes and AI-powered scams",
			"Safety habits to adopt now",
		],
		keyTakeaways: [
			"Never paste secrets or personal data into AI tools",
			"Verify before you trust, especially media",
			"Good habits beat any single tool or setting",
		],
		needsReview: true,
		events: [
			{
				eventName: "Ctrl + Prompt",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2026-01-08",
				venue: "FEU Institute of Technology",
				audienceSize: 20,
			},
		],
	},
	{
		title: "From Zero to Trainium: Your First Model on AWS's PyTorch Stack",
		tagline: "Provision Trainium, port a model, and train it in under an hour.",
		type: "Talk",
		category: "Accelerated Computing",
		level: "Intermediate",
		durationMinutes: 10,
		language: "English",
		featured: false,
		tags: ["AWS", "Trainium", "PyTorch", "Neuron"],
		abstract:
			"A quick-start on AWS's native PyTorch stack: provisioning a Trainium instance, porting a model with the Neuron SDK, and running your first training job in under an hour.",
		outline: [
			"What Trainium is and when to reach for it",
			"Provisioning a Trainium instance",
			"Porting a PyTorch model with Neuron",
			"Running and verifying your first training job",
		],
		keyTakeaways: [
			"Trainium is approachable from standard PyTorch",
			"The Neuron SDK handles most of the porting work",
		],
		needsReview: true,
		events: [
			{
				eventName: "AWS Community Day Philippines 2026",
				organizerName: "AWS Cloud Clubs Philippines",
				date: "2026-06-20",
				venue: "AWS Office Philippines",
				audienceSize: 50,
			},
		],
	},
	{
		title: "Introduction to GitHub Copilot and AI Development",
		tagline: "A hands-on intro to coding with Copilot, from autocomplete to agent.",
		type: "Talk",
		category: "Developer Tools",
		level: "Foundational",
		durationMinutes: 30,
		language: "English",
		featured: false,
		tags: ["GitHub Copilot", "AI", "Developer Tools"],
		abstract:
			"A hands-on introduction to GitHub Copilot: prompt patterns, agent mode, and wiring AI assistance into day-to-day development.",
		outline: [
			"Setting up Copilot in your editor",
			"Prompt patterns for better suggestions",
			"Agent mode and the terminal",
			"Where Copilot helps and where to be careful",
		],
		keyTakeaways: [
			"Copilot rewards clear intent and good context",
			"Treat AI output as a draft to review, not gospel",
		],
		needsReview: true,
		events: [
			{
				eventName: "Sparkpoint 2026",
				organizerName: "Microsoft Student Community NU Laguna",
				date: "2026-05-02",
				venue: "National University Laguna",
				audienceSize: 50,
			},
		],
	},
	{
		title: "Initiatives at FEU Tech ACM",
		tagline: "Building ACM-X and the community initiatives behind it.",
		type: "Talk",
		category: "Community",
		level: "Foundational",
		durationMinutes: 30,
		language: "English",
		featured: false,
		tags: ["Community", "Leadership", "ACM-X", "Student Org"],
		abstract:
			"An inside look at the initiatives built for the FEU Tech ACM Student Chapter, including Project ACM-X, a cross-platform app with a dashboard, forum, undertaking generator, notifications, and more, and the Beyond Campus Initiative.",
		outline: [
			"The problems student orgs face at scale",
			"Project ACM-X and its feature set",
			"The build roadmap and rollout",
			"The ACM Beyond Campus Initiative",
		],
		keyTakeaways: [
			"Small automations save thousands of student-hours per year",
			"Community tooling is a force multiplier for student orgs",
		],
		primarySlideUrl: canva("DAF-vkkrquk"),
		events: [
			{
				eventName: "Into the Code: F++ 4.0 Day 1",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2024-04-20",
				venue: "FEU Institute of Technology",
				audienceSize: 100,
				slideUrl: canva("DAF-vkkrquk"),
			},
		],
	},
	{
		title: "The Filipino Dream in Tech",
		tagline: "Why tech is one of the best industries for Filipino students to enter.",
		type: "Talk",
		category: "Career",
		level: "Foundational",
		durationMinutes: 60,
		language: "English",
		featured: false,
		tags: ["Career", "Inspiration", "Computer Science", "Students"],
		abstract:
			"A motivational outreach talk for high-school students: what technology and computer science really are, the honest pros and cons of a tech career, and how to get started, delivered with interactive challenges and giveaways.",
		outline: [
			"What is technology, and what is computer science?",
			"The honest pros and cons of a tech career",
			"How and where to get started",
			"Interactive challenge and Q&A",
		],
		keyTakeaways: [
			"Tech is flexible, remote-friendly, and largely self-studiable",
			"Getting started is more about consistency than credentials",
		],
		primarySlideUrl: canva("DAF_ciFtU9o"),
		events: [
			{
				eventName: "Into the Code: F++ 4.0 Outreach",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2024-04-22",
				venue: "Valenzuela National High School",
				audienceSize: 50,
				slideUrl: canva("DAF_ciFtU9o"),
			},
		],
	},
];

function build() {
	const stamp = "2026-06-14T00:00:00.000Z";
	return TALKS.map((t) => {
		const slug = slugify(t.title);
		return {
			slug,
			title: t.title,
			tagline: t.tagline ?? "",
			type: t.type ?? "Talk",
			category: t.category ?? "Community",
			level: t.level ?? "Foundational",
			durationMinutes: t.durationMinutes ?? 60,
			language: t.language ?? "English",
			tags: t.tags ?? [],
			abstract: t.abstract ?? "",
			outline: t.outline ?? [],
			keyTakeaways: t.keyTakeaways ?? [],
			featured: Boolean(t.featured),
			needsReview: Boolean(t.needsReview),
			showcaseImage: t.showcaseImage ?? "",
			primarySlideUrl: t.primarySlideUrl ?? "",
			videoUrl: t.videoUrl ?? "",
			events: (t.events ?? []).map((e, i) => ({
				id: `${slug}-${i + 1}`,
				eventName: e.eventName,
				organizerName: e.organizerName,
				organizerLogo: e.organizerLogo ?? "",
				date: e.date,
				venue: e.venue ?? "",
				audienceSize: e.audienceSize ?? 0,
				slideUrl: e.slideUrl ?? "",
				videoUrl: e.videoUrl ?? "",
			})),
			createdAt: stamp,
			updatedAt: stamp,
		};
	});
}

async function main() {
	const talks = build();
	const outPath = path.join(root, "data", "talks.seed.json");
	await writeFile(outPath, JSON.stringify(talks, null, "\t") + "\n");
	console.log(
		`[seed-talks] wrote ${talks.length} talks (${talks.reduce(
			(n, t) => n + t.events.length,
			0,
		)} events) to data/talks.seed.json`,
	);

	const url =
		process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
	const token =
		process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
	if (!url || !token) {
		console.log(
			"[seed-talks] Upstash not configured; wrote JSON only. Set UPSTASH_REDIS_REST_URL/TOKEN to push to Redis.",
		);
		return;
	}
	const { Redis } = await import("@upstash/redis");
	const redis = new Redis({ url, token });
	for (const talk of talks) {
		await redis.set(`talk:${talk.slug}`, talk);
		await redis.sadd("talks:slugs", talk.slug);
	}
	console.log(`[seed-talks] seeded ${talks.length} talks into Upstash.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
