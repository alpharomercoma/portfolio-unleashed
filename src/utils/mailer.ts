import { env } from "@/env";
import { createTransport } from "nodemailer";

const mailerOptions = {
	host: env.EMAIL_SERVER_HOST,
	port: +env.EMAIL_SERVER_PORT,
	service: "gmail",
	auth: {
		user: env.EMAIL_SERVER_USER,
		pass: env.EMAIL_SERVER_PASSWORD,
	},
};

const createTransporter = async () => {
	const transporter = createTransport({
		...mailerOptions,
		pool: true,
		from: `Alpha's Website Form: <${env.EMAIL_SERVER_USER}>`,
		opportunisticTLS: true,
		priority: "high",
		connectionTimeout: 10 * 60 * 1000, // 10 minutes
		greetingTimeout: 5 * 60 * 1000, // 5 minutes
	});
	return transporter;
};

async function sendMail(to: string, subject: string, html: string) {
	try {
		const emailTransporter = await createTransporter();
		await emailTransporter.sendMail({
			to,
			subject,
			html,
		});
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
}

export default sendMail;
