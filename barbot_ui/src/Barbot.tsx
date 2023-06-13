import { useState, useEffect } from 'react';
import BarbotService from './BarbotService';
import recipes from './recipes';
import importedConfig from './data/config.json';

interface Recipe {
    id: string;
    name: string;
    ingredients: { ingredient: string; amount: number }[];
}

interface Config {
    ingredients: { [key: string]: string };
    flow_rates: { [key: string]: number };
    time_offset: number;
}

const Barbot = () => {
    const [recipeOptions, setRecipeOptions] = useState<Recipe[]>([]);
    const [config, setConfig] = useState<Config>({} as Config);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        setConfig(importedConfig);
        filterRecipeOptions(recipes, importedConfig);
    }, []);

    const filterRecipeOptions = (recipes: Recipe[], config: Config) => {
        const availableIngredientSet = new Set(Object.values(config.ingredients));
        const filteredRecipes = recipes.filter(recipe =>
            recipe.ingredients.every(ingredient =>
                availableIngredientSet.has(ingredient.ingredient)
            )
        );
        setRecipeOptions(filteredRecipes);
    };

    const handleSelectDrink = (recipe: Recipe) => {
        if (recipe === selectedRecipe) {
            setSelectedRecipe(null);
        } else {
            setSelectedRecipe(recipe);
        }
    };

    const handleMakeDrink = () => {
        if (!selectedRecipe) return;

        const durations = ["0", "1", "2", "3", "4", "5", "6"].map(key => {
            const ingredient = config.ingredients[key];
            const recipeIngredient = selectedRecipe.ingredients.find(
                recipeIngredient => recipeIngredient.ingredient === ingredient
            );
            const duration = recipeIngredient ? (recipeIngredient.amount / config.flow_rates[key]) * 1000 + config.time_offset : 0;
            return duration;
        });
        BarbotService.actuatePumps(durations)
            .then(() => console.log('Drink is being prepared'))
            .catch(console.error);
        setSelectedRecipe(null);
    };

    return (
        <div className="barbot-container">
            <ul className="drink-list">
                {recipeOptions.map(recipe => (
                    <li key={recipe.id}>
                        <button
                            className={selectedRecipe === recipe ? 'selected' : ''}
                            onClick={() => handleSelectDrink(recipe)}
                        >{recipe.name}</button>
                    </li>
                ))}
                <li>
                    <button className="mix-drink" onClick={handleMakeDrink}>Mix Drink</button>
                </li>
            </ul>
        </div>
    );
};

export default Barbot;
