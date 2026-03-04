// Mocked auth functions for MVP
// In production, this would verify the JWT token natively

export async function verifyToken(token: string) {
    // We return a mock payload for any token
    // This satisfies the layout check and gives us the MVP's hardcoded values
    return {
        partner_id: 14,
        b2b: true,
    };
}
