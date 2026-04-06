export function toSlug(name: string, maxLen = 50) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.substring(0, maxLen);
}

export const CONTENT_TYPE_MAP: Record<number, number> = {
	1: 3,
	2: 1,
	3: 4,
	4: 5,
	5: 6,
	6: 7,
};

export const STATUS_MAP: Record<number, string> = {
	1: "upcoming",
	2: "ongoing",
	3: "completed",
	4: "cancelled",
	5: "tba",
};
