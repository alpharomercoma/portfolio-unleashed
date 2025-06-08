"use client";

import axios from "@/utils/axios";
import { useState } from "react";
import Spinner from "./ui/spinner";

export interface ContactForm {
	name: string;
	email: string;
	company: string;
	title: string;
	purpose: string;
	message: string;
}
export default function ContactForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState<ContactForm>({
		name: "",
		email: "",
		company: "",
		title: "",
		purpose: "",
		message: "",
	});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prevState) => ({ ...prevState, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			setIsLoading(true);
			const res = await axios.post("/contact", formData);
			if (res.status === 201) alert(res.data.message);
			setFormData({
				name: "",
				email: "",
				company: "",
				title: "",
				purpose: "",
				message: "",
			});
		} catch (error) {
			console.error(error);
			alert(
				"An error occurred while submitting the form. Please contact me directly on LinkedIn: https://www.linkedin.com/in/alpharomercoma",
			);
		}
		setIsLoading(false);
	};

	return (
		<section id="contact" className="py-12 bg-gray-50">
			{isLoading && <Spinner />}
			<div className="container mx-auto px-4 max-w-3xl">
				<h2 className="text-3xl font-bold mb-10 text-center">
					Let&apos;s Discuss!
				</h2>
				<form
					onSubmit={handleSubmit}
					className="bg-white shadow-xl rounded-lg p-8"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Name
							</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
								placeholder="John Doe"
								className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
							/>
						</div>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Email
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								required
								placeholder="johndoe@example.com"
								className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
							/>
						</div>
						<div>
							<label
								htmlFor="company"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Company
							</label>
							<input
								type="text"
								id="company"
								name="company"
								value={formData.company}
								onChange={handleChange}
								placeholder="Acme Inc."
								className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
							/>
						</div>
						<div>
							<label
								htmlFor="title"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								value={formData.title}
								onChange={handleChange}
								placeholder="Research Scientist"
								className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
							/>
						</div>
					</div>
					<div className="mt-6">
						<label
							htmlFor="purpose"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Purpose of Contact
						</label>
						<select
							id="purpose"
							name="purpose"
							value={formData.purpose}
							onChange={handleChange}
							required
							className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
						>
							<option value="">Select a purpose</option>
							<option value="Project Collaboration">
								Project Collaboration
							</option>
							<option value="Research Collaboration">
								Research Collaboration
							</option>
							<option value="Career Opportunities">Career Opportunities</option>
							<option value="Speaking Engagement">Speaking Engagement</option>
							<option value="Mentorship and Guidance">
								Mentorship and Guidance
							</option>
							<option value="Community Building">Community Building</option>
							<option value="Knowledge Sharing">Knowledge Sharing</option>
						</select>
					</div>
					<div className="mt-6">
						<label
							htmlFor="message"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Message
						</label>
						<textarea
							id="message"
							name="message"
							value={formData.message}
							onChange={handleChange}
							required
							rows={4}
							placeholder="Please provide details about your inquiry..."
							className="w-full min-h-64 px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
						></textarea>
					</div>
					<div className="mt-8">
						<button
							type="submit"
							className="w-full bg-gray-950 text-white py-2 px-4 rounded-md text-lg font-semibold hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
						>
							Send Message
						</button>
					</div>
				</form>
			</div>
		</section>
	);
}
