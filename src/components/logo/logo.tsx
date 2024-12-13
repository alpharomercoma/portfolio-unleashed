import Image from "next/image";
interface Props {
	props: {
		width: number;
		height: number;
	};
}
function Logo({ props }: Props) {
	const { width, height } = props;
	return (
		<Image
			src="/web-app-manifest-512x512.png"
			className="h-8 w-8 mr-2 rounded-lg"
			alt="Alpha Romer Coma"
			width={width}
			height={height}
		/>
	);
}

export default Logo;
