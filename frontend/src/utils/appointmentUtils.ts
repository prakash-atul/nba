/**
 * Generates a default appointment order number
 * Format: APT/{YEAR}/{ROLE}/{PREFIX}{ID}/{RANDOM}
 */
export const generateAppointmentOrder = (
	role: "DEAN" | "HOD",
	id: number | string,
) => {
	const year = new Date().getFullYear();
	const prefix = role === "DEAN" ? "S" : "D";
	const sequence = Math.floor(Math.random() * 899) + 100; // Unique sequence per session
	return `APT/${year}/${role}/${prefix}${id}/${sequence}`;
};
