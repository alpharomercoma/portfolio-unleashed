"use client";

import { useEffect, useRef } from "react";

/**
 * One reveal-on-scroll primitive for every home section.
 *
 * Elements marked `.animate-on-scroll` start at `opacity-0` and get
 * `.animate-fade-up` the first time they enter the viewport, then stop being
 * observed. Under `prefers-reduced-motion` everything is revealed immediately
 * (no transform, no stagger) so content is never hidden behind an animation.
 *
 * Elements added later (a "Show all" expansion, a carousel page) are picked up
 * by a MutationObserver, otherwise they would mount at opacity-0 and never be
 * revealed.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
	const ref = useRef<T>(null);

	useEffect(() => {
		const root = ref.current;
		if (!root) return;

		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const revealNow = (el: HTMLElement) => {
			el.classList.remove("opacity-0");
			el.style.animationDelay = "0ms";
		};

		const observer = reduce
			? null
			: new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (!entry.isIntersecting) continue;
							entry.target.classList.add("animate-fade-up");
							observer?.unobserve(entry.target);
						}
					},
					{ threshold: 0.1 },
				);

		const seen = new WeakSet<Element>();
		const track = (scope: ParentNode) => {
			const targets = scope.querySelectorAll<HTMLElement>(".animate-on-scroll");
			targets.forEach((el) => {
				if (seen.has(el)) return;
				seen.add(el);
				if (observer) observer.observe(el);
				else revealNow(el);
			});
		};

		track(root);

		const mutations = new MutationObserver((records) => {
			for (const record of records) {
				record.addedNodes.forEach((node) => {
					if (!(node instanceof HTMLElement)) return;
					if (node.matches(".animate-on-scroll"))
						track(node.parentNode ?? node);
					else track(node);
				});
			}
		});
		mutations.observe(root, { childList: true, subtree: true });

		return () => {
			observer?.disconnect();
			mutations.disconnect();
		};
	}, []);

	return ref;
}
