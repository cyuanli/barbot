import { useState, useEffect, useRef } from 'react';
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

interface StatusMessage {
    timestamp: number;
    remainingJobTime: number;
}

const useBarbotModel = () => {
    const [recipeOptions, setRecipeOptions] = useState<Recipe[]>(JSON.parse(localStorage.getItem('recipeOptions') || '[]'));
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(JSON.parse(localStorage.getItem('selectedRecipe') || 'null'));
    const [config, setConfig] = useState<Config>(JSON.parse(localStorage.getItem('config') || JSON.stringify(defaultConfig)));
    const [isOnline, setIsOnline] = useState<boolean>(false);
    const [isBusy, setIsBusy] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
    const onlineTimerIdRef = useRef<NodeJS.Timeout | null>(null);
    const busyTimerIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        BarbotService.getWebPubSubURL()
            .then(url => {
                const socket = new WebSocket(url);
                socket.onmessage = (event) => {
                    const statusMessage: StatusMessage = JSON.parse(event.data);
                    setStatusMessage(statusMessage);
                };
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (statusMessage) {
            const messageTime = new Date(statusMessage.timestamp).getTime();
            const currentTime = Date.now();
            console.log("Received status message: " + JSON.stringify(statusMessage));
            const timeDiff = currentTime - messageTime;
            setIsOnline(timeDiff < 4000);
            if (onlineTimerIdRef.current) {
                clearTimeout(onlineTimerIdRef.current);
            }
            onlineTimerIdRef.current = setTimeout(() => setIsOnline(false), 4000 - timeDiff);

            const remainingJobTime = statusMessage.remainingJobTime * 1000;
            if (remainingJobTime > 0) {
                setIsBusy(true);
                if (busyTimerIdRef.current) {
                    clearTimeout(busyTimerIdRef.current);
                }
                busyTimerIdRef.current = setTimeout(() => setIsBusy(false), remainingJobTime);
            } else {
                setIsBusy(false);
            }
        }

        return () => {
            if (onlineTimerIdRef.current) {
                clearTimeout(onlineTimerIdRef.current);
            }
            if (busyTimerIdRef.current) {
                clearTimeout(busyTimerIdRef.current);
            }
        }
    }, [statusMessage]);

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
            .then(() => console.log('Successfully sent job: ' + JSON.stringify(durations)))
            .catch(console.error);
        setSelectedRecipe(null);
    };

    const handleNewConfig = (newConfig: Config) => {
        setConfig(newConfig);
    }

    return { recipeOptions, selectedRecipe, config, isOnline, isBusy, handleSelectDrink, handleMakeDrink, handleNewConfig };
};

export default useBarbotModel;
