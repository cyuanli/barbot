from flask import Flask, request, jsonify
from flask_cors import CORS
from .barbot_controller import BarbotController

app = Flask(__name__)
CORS(app)
barbot = BarbotController()


@app.route("/drinks", methods=["GET"])
def get_drinks():
    return jsonify(barbot.get_mixable_drinks())


@app.route("/mix", methods=["POST"])
def mix_drink():
    data = request.get_json()
    recipe_id = data.get("recipe_id")
    if recipe_id is None:
        return jsonify({"error": "No recipe_id provided"}), 400
    barbot.mix_drink(recipe_id)
    return jsonify({"message": "Drink is being prepared"}), 200


@app.route("/test", methods=["GET"])
def test_pumps():
    barbot.test_pumps()
    return jsonify({"message": "Testing pumps"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
