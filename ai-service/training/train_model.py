import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

# Sample historical preparation dataset matching Hyderabad House actual kitchen prep data
data = [
    # outlet_id, menu_category, total_quantity, item_count, current_pending_orders, actual_prep_time_minutes
    (1, "Chicken Biryani", 1, 1, 0, 16),
    (1, "Chicken Biryani", 1, 1, 2, 18),
    (1, "Chicken Biryani", 2, 2, 4, 22),
    (1, "Chicken Biryani", 4, 2, 6, 28),
    (1, "Chicken Biryani", 6, 3, 8, 35),
    (1, "Mutton Biryani", 1, 1, 1, 20),
    (1, "Mutton Biryani", 2, 1, 3, 24),
    (1, "Mutton Biryani", 3, 2, 7, 32),
    (1, "Mutton Biryani", 5, 3, 10, 42),
    (1, "Veg Biryani", 1, 1, 1, 15),
    (1, "Veg Biryani", 2, 2, 3, 19),
    (1, "Veg Biryani", 4, 2, 5, 23),
    (1, "Starters", 1, 1, 1, 12),
    (1, "Starters", 2, 1, 3, 15),
    (1, "Starters", 4, 2, 5, 20),
    (1, "Kebabs", 2, 1, 2, 18),
    (1, "Kebabs", 3, 2, 5, 24),
    (1, "Kebabs", 5, 3, 8, 30),
    (1, "Haleem", 1, 1, 0, 8),
    (1, "Haleem", 2, 1, 4, 12),
    (1, "Haleem", 4, 2, 8, 18),
    (1, "Desserts", 1, 1, 0, 5),
    (1, "Desserts", 3, 1, 2, 8),
    (1, "Beverages", 2, 1, 1, 5),

    (2, "Chicken Biryani", 1, 1, 1, 15),
    (2, "Chicken Biryani", 2, 2, 3, 20),
    (2, "Chicken Biryani", 3, 2, 6, 26),
    (2, "Mutton Biryani", 1, 1, 2, 21),
    (2, "Mutton Biryani", 2, 1, 4, 25),
    (2, "Mutton Biryani", 4, 2, 8, 34),
    (2, "Veg Biryani", 2, 2, 2, 18),
    (2, "Starters", 1, 1, 2, 12),
    (2, "Kebabs", 2, 2, 3, 18),
    (2, "Haleem", 3, 1, 5, 15),

    (3, "Chicken Biryani", 2, 1, 5, 25),
    (3, "Chicken Biryani", 4, 2, 9, 34),
    (3, "Mutton Biryani", 2, 2, 8, 30),
    (3, "Mutton Biryani", 3, 1, 10, 36),
    (3, "Haleem", 3, 1, 9, 28),
    (3, "Starters", 2, 2, 6, 20),

    (4, "Chicken Biryani", 2, 1, 3, 22),
    (4, "Mutton Biryani", 2, 2, 4, 28),
    (4, "Kebabs", 4, 2, 6, 26),
    (5, "Chicken Biryani", 3, 2, 5, 25),
    (5, "Mutton Biryani", 3, 2, 6, 30),
    (6, "Chicken Biryani", 1, 1, 2, 17),
    (6, "Starters", 3, 2, 4, 18),
    (7, "Veg Biryani", 2, 1, 2, 16),
    (8, "Chicken Biryani", 2, 1, 3, 20),
    (9, "Mutton Biryani", 2, 1, 4, 25),
    (10, "Chicken Biryani", 4, 2, 7, 30),
    (11, "Haleem", 4, 2, 6, 20),
    (12, "Chicken Biryani", 2, 1, 3, 21),
    (13, "Kebabs", 2, 1, 4, 20),
    (14, "Mutton Biryani", 3, 2, 6, 29),
    (15, "Chicken Biryani", 2, 1, 4, 23),
    (16, "Chicken Biryani", 1, 1, 1, 12),
    (17, "Chicken Biryani", 2, 1, 2, 18)
]

columns = [
    "outlet_id", "menu_category", "total_quantity", 
    "item_count", "current_pending_orders", "actual_prep_time_minutes"
]

df = pd.DataFrame(data, columns=columns)

X = df[["outlet_id", "menu_category", "total_quantity", "item_count", "current_pending_orders"]]
y = df["actual_prep_time_minutes"]

categorical_features = ["outlet_id", "menu_category"]
numerical_features = ["total_quantity", "item_count", "current_pending_orders"]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("num", StandardScaler(), numerical_features)
    ]
)

model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("regressor", RandomForestRegressor(n_estimators=100, random_state=42))
])

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Model trained successfully!")
print(f"Test MAE: {mae:.2f} minutes")
print(f"Test R²: {r2:.2f}")

os.makedirs("/Users/maruthikumar/Desktop/HYDERABAD HOUSE/ai-service/models", exist_ok=True)
model_path = "/Users/maruthikumar/Desktop/HYDERABAD HOUSE/ai-service/models/prep_time_model.joblib"
joblib.dump(model, model_path)
print(f"Model saved to: {model_path}")
