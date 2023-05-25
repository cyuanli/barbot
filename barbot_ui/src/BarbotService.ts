const API_URL = 'http://localhost:5000';

class BarbotService {
    static async getRecipes(): Promise<string[]> {
        const response = await fetch(`${API_URL}/drinks`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    static async mixDrink(recipeId: string): Promise<void> {
        const response = await fetch(`${API_URL}/mix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipe_id: recipeId }),
        });
        return await response.json();
    }
}

export default BarbotService;
