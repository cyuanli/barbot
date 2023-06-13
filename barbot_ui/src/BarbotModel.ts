import { useState, useEffect } from 'react';
import BarbotService from './BarbotService';
import recipes from './recipes';
import defaultConfig from './data/config.json';

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

const useBarbotModel = () => {
    const [recipeOptions, setRecipeOptions] = useState<Recipe[]>(JSON.parse(localStorage.getItem('recipeOptions') || '[]'));
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(JSON.parse(localStorage.getItem('selectedRecipe') || 'null'));
    const [config, setConfig] = useState<Config>(JSON.parse(localStorage.getItem('config') || JSON.stringify(defaultConfig)));

    useEffect(() => {
        localStorage.setItem('recipeOptions', JSON.stringify(recipeOptions));
        localStorage.setItem('selectedRecipe', JSON.stringify(selectedRecipe));
        localStorage.setItem('config', JSON.stringify(config));
        filterRecipeOptions(recipes, config);
    }, [recipeOptions, selectedRecipe, config]);

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

    const handleNewConfig = (newConfig: Config) => {
        setConfig(newConfig);
    }

    return { recipeOptions, selectedRecipe, config, handleSelectDrink, handleMakeDrink, handleNewConfig };
};

export default useBarbotModel;
