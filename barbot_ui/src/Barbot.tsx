import useBarbotModel from './BarbotModel';

const Barbot = () => {
    const { recipeOptions, selectedRecipe, handleSelectDrink, handleMakeDrink } = useBarbotModel();

    return (
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
                <button className="confirm-button" onClick={handleMakeDrink}>Mix Drink</button>
            </li>
        </ul>
    );
};

export default Barbot;
