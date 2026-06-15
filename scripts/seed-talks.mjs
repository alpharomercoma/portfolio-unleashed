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
import { existsSync } from "node:fs";
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

// Canva public-view URLs need the share token after the design id, otherwise
// Canva returns an access-denied page (the tokenless /design/<id>/view 303s away).
const CANVA_TOKENS = {
	DAGbBFeOF8Y: "rqAdKRR_ScEbVmp6HJzOJQ",
	DAGfkJiDlTU: "-5yJxltDAmR2lSMGxLgtTg",
	DAGqHG1iTqc: "47m0L7mWC7q24rOU5kQzeQ",
	DAG3vgFTIRw: "lX11R-l5WCG5HWNGph9WKA",
	"DAF-vkkrquk": "l98xZeGkXN9ULHIIz38GjA",
	DAF_ciFtU9o: "_WSNwT2EvG-RRcZn0dVbxw",
	DAGSHoSgVYE: "o8DVbBqk80T00npdVFSs2g",
	DAGgCsmcztc: "tl9-PQ-MqNSL42RuamjAqA",
	DAGsYa9Ivhw: "F8zdWJRzINK8vPgjArJ7Dw",
	DAG3MtSllRU: "ALPO2D_8PBPXoApxNW17zQ",
};
const canva = (id) => {
	const token = CANVA_TOKENS[id];
	return token
		? `https://www.canva.com/design/${id}/${token}/view`
		: `https://www.canva.com/design/${id}/view`;
};
const gslides = (id) => `https://docs.google.com/presentation/d/${id}/edit`;

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
			"How and why to move PyTorch development onto AI accelerators. Covers how ASICs and the XLA/Neuron compilers work, PyTorch/XLA on Google TPU and TorchNeuronX on AWS Trainium, the performance picture and the 'compiler tax', the common ASIC errors you'll hit, and a practical migration decision framework, benchmarked across H100, TPU v6e, and Trainium.",
		outline: [
			"Deep learning computations and how ASICs and XLA work",
			"Google TPU with PyTorch/XLA",
			"AWS Trainium with TorchNeuronX",
			"Performance analysis and the 'compiler tax'",
			"Common ASIC errors (device busy, OOM) and their fixes",
			"Migration decision notes: when to move",
			"The way forward: TorchTPU, MAIA 200, TPU v7 vs Trainium3 vs NVIDIA",
		],
		keyTakeaways: [
			"PyTorch/XLA and TorchNeuronX let you keep PyTorch while targeting TPU and Trainium",
			"Budget for the 'compiler tax': graph compilation and torch_xla.sync() change how you code",
			"Most ASIC failures are device-busy or OOM, with known, quick fixes",
			"ASICs build on top of PyTorch, so your skills transfer",
		],
		primarySlideUrl: gslides("1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc"),
		needsReview: false,
		events: [
			{
				eventName: "PyTorch Conference Europe 2026",
				organizerName: "Linux Foundation",
				date: "2026-04-07",
				venue: "Station F, Paris, France",
				audienceSize: 100,
				slideUrl: gslides("1sEqxCAIanj4RxWn3quSA1JZQFzoUjaiRmUxyBjahKmc"),
			},
			{
				eventName: "AI Study Group 2026",
				organizerName: "Data Engineering Pilipinas",
				date: "2026-05-09",
				venue: "Online",
				audienceSize: 20,
				slideUrl: gslides("11Yb8gllp48PWzvoU3Vm22ibUUEJTK7qxswhkkFZKhQE"),
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
			"How to access and use Google's TPU Research Cloud to run serious ML research for free. Covers TPU architecture (TensorCores, MXUs, systolic arrays, ICI/OCS torus topology) versus GPUs and competitors, training with PyTorch/XLA on MNIST, the TRC application process, and a live demo spinning up a TPU VM, with the cost math behind a ~$376,000 grant.",
		outline: [
			"Tensors, operations, and matrix multiplication",
			"TPU architecture (TensorCores, MXUs, systolic arrays) vs GPU and competitors",
			"Reduced precision: bfloat16 vs float32",
			"Model training with PyTorch/XLA on MNIST",
			"TPU Research Cloud: how to apply and gain access",
			"Live demo: spinning up a TPU VM on GCP",
		],
		keyTakeaways: [
			"TRC grants free access to 1,000+ Cloud TPUs for accepted researchers",
			"A v4-64 for 5 months is roughly $376K of compute",
			"bfloat16 for matmul plus float32 accumulation is the precision sweet spot",
			"You can provision a TPU VM in minutes with one gcloud command",
		],
		primarySlideUrl: gslides("1C6ccqrJz--90Po2eo1G8F4Uko0TOejT6SNwInZswiJ4"),
		needsReview: false,
		events: [
			{
				eventName: "DevFest 2025",
				organizerName: "GDG Cloud Manila",
				date: "2025-10-13",
				venue: "LaunchGarage",
				audienceSize: 120,
				slideUrl: gslides("1TZMmXumbaCf4PEIHcNVOuhwniLFJyOvLjPoZrnanb78"),
			},
			{
				eventName: "SOFTCON 2025",
				organizerName: "SOFTCON 2025",
				date: "2025-10-17",
				venue: "Online",
				audienceSize: 120,
				slideUrl: gslides("1C6ccqrJz--90Po2eo1G8F4Uko0TOejT6SNwInZswiJ4"),
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
				slideUrl: gslides("1NkZ__hvRhYn7IHl_Jmo14K3OwfJp7YPvfsCRCvdeUvw"),
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
		primarySlideUrl: gslides("11Yb8gllp48PWzvoU3Vm22ibUUEJTK7qxswhkkFZKhQE"),
		needsReview: false,
		events: [
			{
				eventName: "EDiTH Episode 9",
				organizerName: "FEU Institute of Technology",
				date: "2026-04-10",
				venue: "FEU Institute of Technology",
				audienceSize: 100,
				slideUrl: gslides("11Yb8gllp48PWzvoU3Vm22ibUUEJTK7qxswhkkFZKhQE"),
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
		tags: ["AI", "Product", "v0", "Vercel", "Workshop"],
		abstract:
			"A hands-on workshop, delivered to ~700 attendees at the Philippine Innovation Conference, on building real products with AI. Covers what makes a 'product', the levels and categories of AI, and the generative-AI toolchain, then a live case study building and deploying a hotel booking site and an employee management system with v0 and Vercel, plus the pitfalls of AI-assisted development.",
		outline: [
			"What 'product' means: solving real problems, not clever demos",
			"Levels and categories of AI",
			"Generative-AI tools for product building",
			"Case study: building products with v0",
			"Deploying products with Vercel",
			"Pitfalls of using AI in development",
		],
		keyTakeaways: [
			"Build for a real problem; most startups fail solving ones no one has",
			"v0 plus Vercel takes an idea to a deployed product fast",
			"Know the pitfalls (POC purgatory, evaluation) before you ship",
		],
		primarySlideUrl: gslides("1pQ5gzJtaP9tqAYS1ISIJ79EDVy6LHiWtXpgEOHvfQuo"),
		needsReview: false,
		events: [
			{
				eventName: "Philippine Innovation Conference 2025",
				organizerName: "OpenVerse",
				date: "2025-11-21",
				venue: "University of Batangas",
				audienceSize: 700,
				slideUrl: gslides("1pQ5gzJtaP9tqAYS1ISIJ79EDVy6LHiWtXpgEOHvfQuo"),
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
			"A fast recap of GitHub Universe 2025's AI launches, delivered for the Microsoft Azure Community: Agent HQ, Copilot Plan Mode, custom agents, MCP server integrations, the Copilot CLI, background agents, and Copilot code review, plus GitHub Spark and the Octoverse 2025 report.",
		outline: [
			"Agent HQ, now available in VS Code",
			"Copilot Plan Mode and background agents",
			"Custom agents (name, tools, models, prompts, MCP servers)",
			"MCP server integrations and the Copilot CLI",
			"Copilot code review",
			"Bonus: GitHub Spark, Student Developer Pack, Octoverse 2025",
		],
		keyTakeaways: [
			"Copilot is moving from autocomplete to an agent platform (Agent HQ)",
			"Custom agents plus MCP servers let you tailor Copilot to your stack",
			"The Copilot CLI brings agents to the terminal; Spark generates micro-apps",
		],
		primarySlideUrl: gslides("1V4pM8MyWvL7RDXvM-_AKTCWY1SrnylaAmJcO-tjsS94"),
		needsReview: false,
		events: [
			{
				eventName: "az:Repo: The Code and Cloud Agentic Workshop",
				organizerName: "Microsoft Azure Community",
				date: "2025-11-14",
				venue: "Microsoft Office Philippines",
				audienceSize: 100,
				slideUrl: gslides("1V4pM8MyWvL7RDXvM-_AKTCWY1SrnylaAmJcO-tjsS94"),
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
			"A guided tour of Google's next-generation developer toolkit and how to fold it into your workflow: the free 1-year Google AI Pro for students, the Gemini and Gemma model families, running and fine-tuning models locally (Ollama, AI Edge, Unsloth), and AI-driven development with Google AI Studio and Firebase Studio.",
		outline: [
			"Free Google AI Pro for students (1 year)",
			"The Gemini and Gemma model families",
			"Running models locally and offline (Ollama, Gemma, AI Edge)",
			"Fine-tuning Gemma with Unsloth, and specialized models (MedGemma)",
			"AI-driven development: Google AI Studio and Firebase Studio",
			"Certifications and recommendations",
		],
		keyTakeaways: [
			"Students get a free year of Google AI Pro and the Student Developer Pack",
			"You can run Gemma locally and offline with Ollama and AI Edge",
			"AI Studio and Firebase Studio make 'vibe coding' fast and free",
		],
		primarySlideUrl: gslides("1Vafm3hrMy7Cs2Df_S_LJkFtQmtMSGq49UpfwWjAezsY"),
		needsReview: false,
		events: [
			{
				eventName: "InSession 2025",
				organizerName: "Google Developer Group on Campus - TUP Manila",
				date: "2025-11-06",
				venue: "TUP Manila",
				audienceSize: 100,
				slideUrl: gslides("1Vafm3hrMy7Cs2Df_S_LJkFtQmtMSGq49UpfwWjAezsY"),
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
			"Navigating AI safely as a student: LLM hallucinations, deepfakes, and fake documents; how to make (and therefore recognize) AI-generated images and edits; the tells that give AI images away; and what the privacy policies of major AI companies actually say, with the ethical considerations for NGO use.",
		outline: [
			"Hallucinations, deepfakes, and fake documents",
			"Creating your own AI images and edits",
			"Emerging dangers in the age of AI",
			"Recognizing AI-generated content (hands, textures, physics)",
			"Privacy policies of AI companies",
		],
		keyTakeaways: [
			"Hallucinations range from fact-mixed to pure fabrication, so verify",
			"Spot AI images by hands, plastic textures, and physics violations",
			"Read an AI tool's privacy policy before you feed it your data",
		],
		primarySlideUrl: gslides("1DTv2zeT8myufqUtGj-eS5dnzN3obDTXtop6af8Lm72E"),
		needsReview: false,
		events: [
			{
				eventName: "Ctrl + Prompt",
				organizerName: "FEU Tech ACM Student Chapter",
				date: "2026-01-08",
				venue: "FEU Institute of Technology",
				audienceSize: 20,
				slideUrl: gslides("1DTv2zeT8myufqUtGj-eS5dnzN3obDTXtop6af8Lm72E"),
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
			"A hands-on introduction to GitHub Copilot: installing it in VS Code, the CLI versus the GUI, the four permission modes (interactive, plan, YOLO, autopilot) and the 'permission fatigue' trade-off, plus core capabilities like web search, image input, and the commit generator.",
		outline: [
			"What Copilot is, and installing it in VS Code",
			"Copilot CLI vs GUI",
			"The four permission modes: interactive, plan, YOLO, autopilot",
			"Capabilities: web search, image input, commit generator",
			"Hands-on demo",
		],
		keyTakeaways: [
			"Match the Copilot mode to your trust level (interactive to autopilot)",
			"The CLI brings Copilot to the terminal across Linux, macOS, and Windows",
			"Copilot can search the web, read images, and draft your commits",
		],
		primarySlideUrl: gslides("1diyWyjbFnMRDKm07uJaCz1TL6kR-IKeDuZosOebusq4"),
		needsReview: false,
		events: [
			{
				eventName: "Sparkpoint 2026",
				organizerName: "Microsoft Student Community NU Laguna",
				date: "2026-05-02",
				venue: "National University Laguna",
				audienceSize: 50,
				slideUrl: gslides("1diyWyjbFnMRDKm07uJaCz1TL6kR-IKeDuZosOebusq4"),
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
		// Auto-wire a cover if a title-slide image exists in public/talks/covers/.
		const coverFile = path.join(root, "public", "talks", "covers", `${slug}.jpg`);
		const showcaseImage =
			t.showcaseImage ?? (existsSync(coverFile) ? `/talks/covers/${slug}.jpg` : "");
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
			// `needsReview` is this script's internal flag; the stored model uses
			// a Draft/Published status (drafts are hidden from the public site).
			status: t.needsReview ? "draft" : "published",
			showcaseImage,
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
