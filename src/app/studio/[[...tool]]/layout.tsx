import React from "react";

// The root layout owns <html> and <body>; a second pair here is invalid HTML.
export default function StudioLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <>{children}</>;
}
