import useBarbotModel from './BarbotModel';

const Barbot = () => {
    const { recipeOptions, selectedRecipe, isOnline, isBusy, handleSelectDrink, handleMakeDrink } = useBarbotModel();
    const sortedRecipeOptions = [...recipeOptions].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <ul className="drink-list">
            {sortedRecipeOptions.map(recipe => (
                <li key={recipe.id}>
                    <button
                        className={selectedRecipe === recipe ? 'selected' : ''}
                        onClick={() => handleSelectDrink(recipe)}
                    >{recipe.name}</button>
                </li>
            ))}
            <li>
                {!isOnline ?
                    <button className="button-disabled">
                        Barbot is offline
                    </button> :
                    isBusy ?
                        <button className="button-disabled">
                            Mixing Drink ... <img src="/ftw_spinner.gif" alt="Loading..." className="ftw-spinner" />
                        </button> :
                        <button className="button-confirm" onClick={handleMakeDrink}>Mix Drink</button>
                }
            </li>
        </ul>
    );
};

export default Barbot;
