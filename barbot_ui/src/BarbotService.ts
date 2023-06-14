class BarbotService {
    static async getWebPubSubURL(): Promise<string> {
        const response = await fetch(`api/negotiate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    }

    static async actuatePumps(durations: number[]): Promise<void> {
        const response = await fetch(`api/job`, {
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
