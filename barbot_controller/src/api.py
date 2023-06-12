from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from .barbot_controller import BarbotController, BarbotActuationError

app = Flask(__name__)
CORS(app)
barbot = BarbotController()


@app.errorhandler(400)
@app.errorhandler(500)
def handle_error(error):
    return jsonify({"error": str(error)}), error.code


@app.route("/test", methods=["GET"])
def test_pumps():
    barbot.actuate_pumps([2000] * 7)
    return jsonify({"message": "Testing pumps"}), 200


@app.route("/actuate", methods=["POST"])
def actuate_pumps():
    data = request.get_json()
    durations = data.get("durations")
    if durations is None:
        abort(400, description="No durations provided")
    if not isinstance(durations, list):
        abort(400, description="Durations must be a list")
    if len(durations) != 7:  # Replace 7 with the number of pumps
        abort(400, description="Durations list must have 7 elements")
    if any(not isinstance(d, (int, float)) or d < 0 for d in durations):
        abort(400, description="All durations must be positive numbers")
    try:
        barbot.actuate_pumps(durations)
    except BarbotActuationError as exception:  # Catch specific exceptions if possible
        abort(500, description=str(exception))
    return jsonify({"message": "Pumps are being actuated"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
