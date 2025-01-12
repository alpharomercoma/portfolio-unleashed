import styles from "./markdown-styles.module.css";

type Props = {
	content: string;
};

export function PostBody({ content }: Props) {
	return (
		<div className="max-w-2xl mx-auto">
			<div
				className={styles.richText}
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		</div>
	);
}
