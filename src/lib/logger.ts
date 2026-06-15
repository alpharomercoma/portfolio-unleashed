// Tiny module-tagged logger so server logs are consistent and greppable
// (`[talks] …`, `[upload] …`). Wraps console; swap the sink here if a real log
// service is added later, without touching call sites.
type Level = "info" | "warn" | "error";

export type Logger = {
	info: (message: string, meta?: unknown) => void;
	warn: (message: string, meta?: unknown) => void;
	error: (message: string, meta?: unknown) => void;
};

export function createLogger(module: string): Logger {
	const emit = (level: Level, message: string, meta?: unknown) => {
		const line = `[${module}] ${message}`;
		if (meta !== undefined) console[level](line, meta);
		else console[level](line);
	};
	return {
		info: (m, meta) => emit("info", m, meta),
		warn: (m, meta) => emit("warn", m, meta),
		error: (m, meta) => emit("error", m, meta),
	};
}
