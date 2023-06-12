class BarbotService {
    static async actuatePumps(durations: number[]): Promise<void> {
        const response = await fetch(`api/actuate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ durations: durations }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }
}

export default BarbotService;
