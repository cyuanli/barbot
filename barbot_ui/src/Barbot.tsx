import { useState, useEffect } from 'react';
import BarbotService from './BarbotService';

const Barbot = () => {
    const [recipes, setRecipes] = useState<string[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState('');

    useEffect(() => {
        BarbotService.getRecipes()
            .then(setRecipes)
            .catch(console.error);
    }, []);

    const handleMakeDrink = () => {
        BarbotService.mixDrink(selectedRecipe)
            .then(() => console.log('Drink is being prepared'))
            .catch(console.error);
    };

    return (
        <div>
            <select onChange={e => setSelectedRecipe(e.target.value)}>
                {recipes.map(recipe =>
                    <option key={recipe} value={recipe}>
                        {recipe}
                    </option>
                )}
            </select>
            <button onClick={handleMakeDrink}>Make Drink</button>
        </div>
    );
};

export default Barbot;
