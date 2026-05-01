# Disease Prediction System 

An end-to-end Machine Learning project to predict the likelihood of diseases (Heart Disease, Diabetes, Breast Cancer) based on patient medical data.

## Project Overview
This project demonstrates a full ML lifecycle, including data preprocessing, feature selection, model training (Logic Regression, SVM, Random Forest, XGBoost), and deployment via a Flask web application and a modern React dashboard.

##  Project Structure
- `data/`: Placeholder for datasets.
- `src/ml/`: Python source code for training and preprocessing.
- `models/`: Saved model files (.pkl).
- `app.py`: Flask backend.
- `src/`: React frontend (Vite).
- `requirements.txt`: Python dependencies.

##  Setup Instructions

### Backend (Python/Flask)
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Train the model:
   ```bash
   python src/ml/train.py
   ```
3. Run the Flask app:
   ```bash
   python app.py
   ```

### Frontend (React)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```

##  Ethics & Disclaimer
Machine learning in healthcare is a powerful tool but comes with significant responsibilities:
- **Accuracy Matters**: False negatives (failure to detect a disease) can lead to delayed treatment, while false positives can cause unnecessary anxiety and invasive procedures.
- **Support, Not Replace**: These models should be used as **support tools** for medical professionals, not as a replacement for expert diagnosis.
- **Privacy**: Patient data must be handled with extreme care, following HIPPA or GDPR regulations.
- **Biases**: Models can inherit biases from the training data. Regular audits are necessary to ensure fairness across different demographics.

**DISCLAIMER**: This application is for educational purposes only. Always consult a qualified medical professional for health concerns.

---
Built as a Internship portfolio project.
