import argparse
import json
import os
from pathlib import Path
import time

from tqdm import tqdm
from serial import Serial, SerialException

SERIAL_PORT = "/dev/ttyUSB0"

TIME_UNIT = 500  # time resolution of the arduino in ms
TIME_OFFSET = 500  # ms between pump start and liquid pouring into glass
FLOW_RATES = [30, 30, 30, 30, 30, 30, 30]  # ml/s


class BarbotController:
    def __init__(self):
        """
        Initialize the Barbot instance by setting up the serial connection,
        loading ingredients, configuration, and recipes.
        """

        print("Initalizing barbot ...")
        for _ in range(10):
            try:
                self.serial = Serial(SERIAL_PORT)
                time.sleep(2)  # Wait a bit for serial connection
            except SerialException:
                print("Barbot is not connected, try again ...")
                time.sleep(1)
                continue
            break
        assert hasattr(self, "serial"), "Failed to initialize Barbot."

        data_dir = Path(__file__).parent.parent / "data"

        # Load ingredients
        with open(
            data_dir / "ingredients.json", "r", encoding="UTF-8"
        ) as ingredients_file:
            all_ingredients = json.load(ingredients_file)
            self.ingredients = {item["id"]: item for item in all_ingredients}

        # Load config
        with open(data_dir / "config.json", "r", encoding="UTF-8") as config_file:
            config = json.load(config_file)
            self.available_ingredient_slots = {v: int(k) for k, v in config.items()}
            for ingredient in self.available_ingredient_slots.keys():
                assert (
                    ingredient in self.ingredients.keys()
                ), f"Unknown ingredient in config: {ingredient}"

        # Load recipes
        self.recipes = {}
        recipes_dir = data_dir / "recipes"
        for filename in os.listdir(recipes_dir):
            with open(
                recipes_dir.joinpath(filename), "r", encoding="UTF-8"
            ) as recipe_file:
                recipe = json.load(recipe_file)
                for item in recipe["ingredients"]:
                    assert (
                        item["ingredient"] in self.ingredients.keys()
                    ), f"Unknown ingredient in recipe: {item['ingredient']}"
                if self._is_mixable_recipe(recipe):
                    self.recipes[recipe["id"]] = recipe

        print("Barbot is ready.")

    def __del__(self):
        """
        Destructor for the Barbot instance, ensuring the serial connection is closed.
        """
        if hasattr(self, "serial"):
            self.serial.close()

    def run(self):
        """
        Run the main loop of the program, asking the user to choose a drink and
        mixing the selected drink. Continues until the user stops the program.
        """
        id_recipe_map = dict(enumerate(sorted(self.recipes.keys())))
        while True:
            print(
                "---\nWhich drink would you like?\nMAKE SURE THERE IS A GLASS UNDER THE SPOUT"
            )
            for i in range(len(self.recipes)):
                print(f"{i + 1}) {self.recipes[id_recipe_map[i]]['name']}")
            try:
                drink_id = input()
            except KeyboardInterrupt:
                print("Exiting the program.")
                break
            if not drink_id.isdigit() or int(drink_id) - 1 not in range(
                len(self.recipes)
            ):
                print("Invalid input. Try again.")
                continue
            print("Mixing drink, please wait ...")
            self.mix_drink(id_recipe_map[int(drink_id) - 1])
            print("Drink done, enjoy!")
            time.sleep(2)

    def get_mixable_drinks(self):
        """
        Return a list of mixable drink keys based on the available ingredients.

        Returns:
            list: A list of mixable drink keys.
        """
        return list(self.recipes.keys())

    def mix_drink(self, recipe_id):
        """
        Mix a drink based on the provided recipe ID.

        Args:
            recipe_id (str): The ID of the recipe to mix.
        """
        if recipe_id not in self.recipes:
            print(f"{recipe_id} is not mixable.")
            return
        job = self._create_job(self.recipes[recipe_id]["ingredients"])
        self._execute_job(job)

    def test_pumps(self):
        self._execute_job([3000] * 7)

    def _is_mixable_recipe(self, recipe):
        """
        Check if a recipe is mixable based on the available ingredients.

        Args:
            recipe (dict): A dictionary representing a drink recipe.

        Returns:
            bool: True if the recipe is mixable, False otherwise.
        """
        return all(
            item["ingredient"] in self.available_ingredient_slots.keys()
            for item in recipe["ingredients"]
        )

    def _create_job(self, ingredients):
        """
        Create a job representing the pump durations for each ingredient.

        Args:
            ingredients (list): A list of dictionaries representing the ingredients.

        Returns:
            list: A list of pump durations for each ingredient in milliseconds.
        """
        job = []
        ingredient_amount_map = {
            item["ingredient"]: item["amount"] for item in ingredients
        }
        for ingredient, slot_id in self.available_ingredient_slots.items():
            if not ingredient in ingredient_amount_map.keys():
                pump_duration = 0
            else:
                pump_duration = (
                    ingredient_amount_map[ingredient] / FLOW_RATES[slot_id]
                ) * 1000 + TIME_OFFSET
            job.append(pump_duration)
        return job

    def _execute_job(self, job):
        """
        Execute a job by sending the necessary commands to the Arduino board.

        Args:
            job (list): A list of pump durations for each ingredient.
        """
        job_str = ""
        char_offset = ord("0")
        for pump_duration in job:
            pump_job_ord = round(pump_duration / TIME_UNIT) + char_offset
            assert pump_job_ord <= ord("~"), (
                f"Pump duration too large, " f"cannot pump for {pump_duration} ms."
            )
            job_str += chr(pump_job_ord)
        job_str += "\n"
        self.serial.write(bytes(job_str, "ascii"))
        for _ in tqdm(
            range(round(sum(job) / 500)),
            ncols=80,
            bar_format="{l_bar}{bar}|{remaining}",
        ):
            time.sleep(0.5)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--test-pumps", help="run all pumps for 3 seconds", action="store_true"
    )
    args = parser.parse_args()

    barbot_controller = BarbotController()

    if args.test_pumps:
        barbot_controller.test_pumps()
    else:
        barbot_controller.run()


if __name__ == "__main__":
    main()
