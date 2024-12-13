import React from "react";
import { Button } from "@/components/ui/button";

interface SamplePromptsProps {
	onPromptClick: (prompt: string) => Promise<void>;
	visible: boolean;
}

export const SamplePrompts: React.FC<SamplePromptsProps> = ({
	onPromptClick,
	visible,
}) => {
	const prompts = [
		"What do you love most about Mr. Coma?",
		"Where can I contact Mr. Coma?",
	];

	if (!visible) return null;

	return (
		<div className="flex flex-wrap gap-2 mb-4">
			{prompts.map((prompt, index) => (
				<Button
					key={index}
					variant="outline"
					size="sm"
					className="text-sm whitespace-normal h-auto py-1 px-2 text-left"
					onClick={() => onPromptClick(prompt)}
				>
					{prompt}
				</Button>
			))}
		</div>
	);
};
