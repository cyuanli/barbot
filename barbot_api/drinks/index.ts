import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConfig, getRecipes } from "../utils";

const filterRecipeOptions = (recipes: any[], config: any) => {
    const availableIngredientSet = new Set(Object.values(config.ingredients));
    return recipes
        .filter(recipe => recipe.ingredients.every(ingredient =>
            availableIngredientSet.has(ingredient.ingredient)))
};

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    try {
        const recipes = await getRecipes(context);
        const config = await getConfig(context);

        const availableRecipes = filterRecipeOptions(recipes, config);

        context.res = {
            status: 200,
            body: availableRecipes,
        };
    } catch (e) {
        context.log.error(`Failed to fetch data from Cosmos DB: ${e}`);
        context.res = {
            status: 500,
            body: { "message": "Failed to fetch data from Cosmos DB" },
        };
    }
};

export default httpTrigger;
