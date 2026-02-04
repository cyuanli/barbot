# Barbot

An automated cocktail mixer system that dispenses and mixes drinks based on recipes.

[![Barbot Demo](https://img.youtube.com/vi/TEYJAa9Pyq8/0.jpg)](https://www.youtube.com/watch?v=TEYJAa9Pyq8)

## Architecture

- **barbot_ui** - React web application for selecting drinks and monitoring status
- **barbot_api** - Azure Functions backend for recipe management and job dispatch
- **barbot_controller** - Python daemon that bridges the cloud API to hardware via serial
- **arduino** - Firmware for controlling 7 pump actuators

## How It Works

1. User selects a recipe in the web UI
2. API calculates pump durations from recipe ingredients and pump configurations
3. Job is dispatched via Azure Web PubSub to the controller
4. Controller sends commands to Arduino over serial
5. Arduino actuates pumps to mix the drink

## Tech Stack

- React + TypeScript (frontend)
- Azure Functions + Cosmos DB (backend)
- Azure Web PubSub (real-time messaging)
- Python + PySerial (hardware interface)
- Arduino (pump control)

## Setup

### UI
```bash
cd barbot_ui
npm install
npm start
```

### API
```bash
cd barbot_api
npm install
npm start
```

### Controller
```bash
cd barbot_controller
poetry install
poetry run python src/pubsub_client.py
```

## Configuration

Recipes and pump configurations are stored in Cosmos DB. The configuration includes:
- Ingredient-to-pump mappings
- Pump flow rates (ml/sec)
- Time offsets per pump
