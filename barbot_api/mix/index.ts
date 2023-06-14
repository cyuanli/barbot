import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getConfig, getRecipe, getWebPubSubClient } from "../utils";

const calculateDurations = (config, recipe) => {
    const durations = ["0", "1", "2", "3", "4", "5", "6"].map(key => {
        const ingredient = config.ingredients[key];
        const recipeIngredient = recipe.ingredients.find(
            recipeIngredient => recipeIngredient.ingredient === ingredient
        );
        if (!recipeIngredient) return 0;
        const { flow_rate, time_offset } = config.pump_configs[key];
        return (recipeIngredient.amount / flow_rate) * 1000 + time_offset;
    });
    return durations;
}

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const reqBody = req.body;

    if (!reqBody) {
        context.res = {
            status: 400,
            body: { "message": "Invalid JSON" }
        };
        return;
    }

    const recipeId = reqBody.recipeId;
    if (!recipeId) {
        context.res = {
            status: 400,
            body: { "message": "Missing 'recipeId' in JSON body" }
        };
        return;
    }

    try {
        const config = await getConfig(context);
        const recipe = await getRecipe(context, recipeId);

        if (!recipe) {
            context.res = {
                status: 400,
                body: { "message": "Recipe not found in database" }
            };
            return;
        }

        const durations = calculateDurations(config, recipe);
        const client = await getWebPubSubClient(context, 'job');
        await client.sendToAll({ "durations": durations });

        context.res = {
            status: 200,
            body: { "message": "Mixing drink with durations: " + durations }
        };
    } catch (e) {
        context.log.error(`Failed to mix drink: ${e}`);
        context.res = {
            status: 500,
            body: { "message": "Failed to mix drink" },
        };
    }
};

export default httpTrigger;
