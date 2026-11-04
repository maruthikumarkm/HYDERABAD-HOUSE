import os
import joblib
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Hyderabad House AI Service",
    description="Real-time Preparation Time Prediction & Recommendation Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "prep_time_model.joblib")

# Load trained Scikit-learn model
model = None
try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"Loaded trained Scikit-learn model from: {MODEL_PATH}")
    else:
        print(f"Model file not found at {MODEL_PATH}, will use algorithmic fallback.")
except Exception as e:
    print(f"Error loading model: {e}")

class PrepTimeRequest(BaseModel):
    outlet_id: int = Field(..., example=1)
    menu_category: str = Field(..., example="Chicken Biryani")
    total_quantity: int = Field(..., example=2)
    item_count: int = Field(..., example=2)
    current_pending_orders: int = Field(..., example=3)

class PrepTimeResponse(BaseModel):
    predicted_prep_time_minutes: int
    model_used: str
    confidence_score: float
    factors: dict

class RecommendationRequest(BaseModel):
    customer_id: Optional[int] = None
    previous_item_ids: List[int] = []

class RecommendedItem(BaseModel):
    menu_item_id: int
    name: str
    reason: str
    score: float

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "hyderabad-house-ai-service",
        "model_loaded": model is not None
    }

@app.post("/predict-prep-time", response_model=PrepTimeResponse)
def predict_prep_time(req: PrepTimeRequest):
    global model
    predicted_time = 20.0
    model_name = "Algorithmic-Fallback"

    if model is not None:
        try:
            input_df = pd.DataFrame([{
                "outlet_id": req.outlet_id,
                "menu_category": req.menu_category,
                "total_quantity": req.total_quantity,
                "item_count": req.item_count,
                "current_pending_orders": req.current_pending_orders
            }])
            raw_prediction = model.predict(input_df)[0]
            predicted_time = float(raw_prediction)
            model_name = "RandomForestRegressor-v1.0"
        except Exception as e:
            print(f"Inference error, reverting to fallback: {e}")
            predicted_time = calculate_fallback(req)
    else:
        predicted_time = calculate_fallback(req)

    # Round to nearest integer with sensible minimum
    final_time = max(10, int(round(predicted_time)))

    return PrepTimeResponse(
        predicted_prep_time_minutes=final_time,
        model_used=model_name,
        confidence_score=0.92 if model_name.startswith("RandomForest") else 0.75,
        factors={
            "category": req.menu_category,
            "quantity": req.total_quantity,
            "pending_orders": req.current_pending_orders,
            "outlet_id": req.outlet_id
        }
    )

def calculate_fallback(req: PrepTimeRequest) -> float:
    base = 15.0
    if "Mutton" in req.menu_category:
        base = 22.0
    elif "Chicken" in req.menu_category:
        base = 18.0
    elif "Haleem" in req.menu_category:
        base = 12.0
    elif "Starters" in req.menu_category or "Kebabs" in req.menu_category:
        base = 16.0
    elif "Desserts" in req.menu_category or "Beverages" in req.menu_category:
        base = 8.0

    additional_qty = max(0, req.total_quantity - 1) * 2.5
    queue_impact = req.current_pending_orders * 1.8
    return base + additional_qty + queue_impact

@app.post("/recommendations", response_model=List[RecommendedItem])
def get_recommendations(req: RecommendationRequest):
    # Rule-based collaborative & previous order recommendation
    recommendations = []
    
    # Standard popular Hyderabadi pairings
    pairings = {
        1: [22, 21, 11], # Chicken Biryani pairs with Double Ka Meetha, Mirchi Ka Salan, Chicken 65
        2: [22, 11, 26], 
        3: [22, 23, 11, 15], # Family pack pairs with desserts & tandoori
        5: [22, 23, 17], # Mutton Biryani pairs with Double Ka Meetha, Mutton Sheekh
        8: [22, 14, 26], # Veg Biryani pairs with Paneer 65 & Chaas
        19: [22, 25],    # Haleem pairs with Double Ka Meetha & Irani Chai
    }

    seen_ids = set()
    for item_id in req.previous_item_ids:
        if item_id in pairings:
            for rec_id in pairings[item_id]:
                if rec_id not in req.previous_item_ids and rec_id not in seen_ids:
                    seen_ids.add(rec_id)
                    recommendations.append(RecommendedItem(
                        menu_item_id=rec_id,
                        name=get_dish_name(rec_id),
                        reason="Frequently Ordered Together",
                        score=0.95
                    ))

    # Add general popular items if list is short
    general_popular = [
        (22, "Double Ka Meetha", "Royal Nizami Dessert Special", 0.90),
        (11, "Hyderabadi Chicken 65", "Best Selling Appetizer", 0.88),
        (19, "Royal Hyderabadi Mutton Haleem", "GI-Tagged Chef Special", 0.85),
        (2, "Chicken Dum Biryani (Regular)", "All-Time Favorite", 0.82)
    ]

    for item_id, name, reason, score in general_popular:
        if item_id not in seen_ids and item_id not in req.previous_item_ids:
            seen_ids.add(item_id)
            recommendations.append(RecommendedItem(
                menu_item_id=item_id,
                name=name,
                reason=reason,
                score=score
            ))
        if len(recommendations) >= 4:
            break

    return recommendations[:4]

def get_dish_name(item_id: int) -> str:
    names = {
        1: "Chicken Dum Biryani (Single)",
        2: "Chicken Dum Biryani (Regular)",
        3: "Chicken Dum Biryani (Family Pack)",
        5: "Hyderabadi Mutton Dum Biryani",
        8: "Hyderabadi Veg Dum Biryani",
        11: "Hyderabadi Chicken 65",
        14: "Paneer 65",
        15: "Tandoori Murgh (Half)",
        17: "Mutton Sheekh Kebab",
        19: "Royal Hyderabadi Mutton Haleem",
        21: "Hyderabadi Mirchi Ka Salan (Side)",
        22: "Double Ka Meetha",
        23: "Shahi Qubani Ka Meetha",
        25: "Hyderabadi Irani Chai (Thermos Flask)",
        26: "Masala Buttermilk (Chaas)"
    }
    return names.get(item_id, "Hyderabadi Delicacy")
