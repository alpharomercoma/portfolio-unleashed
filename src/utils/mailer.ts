import { google } from "googleapis";
import { createTransport } from "nodemailer";
const OAuth2 = google.auth.OAuth2;
import { env } from "@/env";

const createTransporter = async () => {
	const oauth2Client = new OAuth2(
		env.OAUTH_CLIENT_ID,
		env.OAUTH_CLIENT_SECRET,
		"https://developers.google.com/oauthplayground",
	);

	oauth2Client.setCredentials({
		refresh_token: env.OAUTH_REFRESH_TOKEN,
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken((err, token) => {
			if (err) {
				console.log("*ERR: ", err);
				reject();
			}
			resolve(token);
		});
	});

	const transporter = createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: env.USER_EMAIL,
			accessToken: accessToken as string,
			clientId: env.OAUTH_CLIENT_ID,
			clientSecret: env.OAUTH_CLIENT_SECRET,
			refreshToken: env.OAUTH_REFRESH_TOKEN,
		},
	});
	return transporter;
};
async function sendMail(to: string, subject: string, html: string) {
	const mailOptions = {
		to,
		subject,
		html,
	};
	const emailTransporter = await createTransporter();
	await emailTransporter.sendMail(mailOptions);
}

export default sendMail;
