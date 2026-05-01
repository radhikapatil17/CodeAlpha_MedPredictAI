import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Attempt to load ML libraries
try:
    import joblib
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: ML libraries (numpy, joblib) not found. Using fallback prediction logic.")

app = Flask(__name__)
CORS(app)

def get_model(disease):
    if not ML_AVAILABLE:
        return None, None
    model_path = f'models/{disease}_model.pkl'
    scaler_path = f'models/{disease}_scaler.pkl'
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            return model, scaler
        except:
            return None, None
    return None, None

def heuristic_predict(disease, data):
    """Fallback prediction logic for environments without ML libraries"""
    score = 0
    if disease == 'heart':
        # Simple Heart Risk heuristic
        age = float(data.get('age', 45))
        chol = float(data.get('chol', 240))
        bp = float(data.get('bp', 130))
        if age > 55: score += 0.3
        if chol > 240: score += 0.4
        if bp > 140: score += 0.3
    elif disease == 'diabetes':
        glucose = float(data.get('glucose', 120))
        bmi = float(data.get('bmi', 24))
        if glucose > 140: score += 0.5
        if bmi > 30: score += 0.4
    elif disease == 'cancer':
        radius = float(data.get('radius', 14))
        area = float(data.get('area', 650))
        if radius > 18: score += 0.5
        if area > 800: score += 0.4
    
    # Add a bit of deterministic variance based on inputs
    prob = min(0.99, max(0.01, score))
    return "High Risk" if prob > 0.5 else "Low Risk", prob

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    disease = data.get('disease', 'heart')
    form_data = data.get('features', {})
    
    model, scaler = get_model(disease)
    
    if ML_AVAILABLE and model and scaler:
        try:
            feature_order = {
                'heart': ['age', 'chol', 'bp', 'hr'],
                'diabetes': ['glucose', 'bmi', 'insulin', 'age'],
                'breast_cancer': ['radius', 'texture', 'area', 'smoothness']
            }
            
            if disease not in feature_order:
                return jsonify({"error": "Invalid disease type"}), 400
                
            ordered_features = [float(form_data.get(f, 0)) for f in feature_order[disease]]
            features_array = np.array(ordered_features).reshape(1, -1)
            scaled_features = scaler.transform(features_array)
            
            prediction = model.predict(scaled_features)[0]
            probability = model.predict_proba(scaled_features)[0][1]
            
            return jsonify({
                "prediction": "High Risk" if prediction == 1 else "Low Risk",
                "probability": float(probability),
                "status": "success",
                "engine": "Machine Learning (True Ensemble)"
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # HEURISTIC FALLBACK
        risk, prob = heuristic_predict(disease, form_data)
        return jsonify({
            "prediction": risk,
            "probability": float(prob),
            "status": "success",
            "engine": "Heuristic Inference Engine (Environment Fallback)"
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
