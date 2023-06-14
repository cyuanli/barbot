import { useState, useEffect, useRef } from 'react';
import BarbotService from './BarbotService';

interface Recipe {
    id: string;
    name: string;
    ingredients: { ingredient: string; amount: number }[];
}

interface StatusMessage {
    timestamp: number;
    remainingJobTime: number;
}

const useBarbotModel = () => {
    const [recipeOptions, setRecipeOptions] =
        useState<Recipe[]>(JSON.parse(localStorage.getItem('recipeOptions') || '[]'));
    const [selectedRecipe, setSelectedRecipe] =
        useState<Recipe | null>(JSON.parse(localStorage.getItem('selectedRecipe') || 'null'));
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
        BarbotService.getRecipes()
            .then(recipes => setRecipeOptions(recipes))
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

    const handleSelectDrink = (recipe: Recipe) => {
        if (recipe === selectedRecipe) {
            setSelectedRecipe(null);
        } else {
            setSelectedRecipe(recipe);
        }
    };

    const handleMakeDrink = () => {
        if (!selectedRecipe) return;
        BarbotService.mixDrink(selectedRecipe)
            .then(() => console.log('Successfully sent job: ' + selectedRecipe.id))
            .catch(console.error);
        setSelectedRecipe(null);
    };

    const handleTestPump = (idx: number, seconds: number) => {
        if (idx < 0 || idx > 6) return;
        let durations = [0, 0, 0, 0, 0, 0, 0];
        durations[idx] = seconds * 1000;
        BarbotService.actuatePumps(durations)
            .then(() => console.log('Test pump: ' + idx + ' for ' + seconds + ' seconds'))
            .catch(console.error);
    };

    return { recipeOptions, selectedRecipe, isOnline, isBusy, handleSelectDrink, handleMakeDrink, handleTestPump };
};

export default useBarbotModel;
