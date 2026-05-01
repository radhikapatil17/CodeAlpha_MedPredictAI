import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import os

# --- STEP 1: DATASET LOADING ---
def load_and_summarize_data(dataset_name="heart"):
    """
    Loads one of the UCI datasets.
    Options: 'heart', 'diabetes', 'breast_cancer'
    """
    from sklearn.datasets import load_breast_cancer, load_diabetes, load_wine
    
    if dataset_name == "heart":
        # Using a URL for the UCI Heart Disease dataset
        url = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
        names = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target']
        df = pd.read_csv(url, names=names, na_values='?')
        # Binarize target (0 = no disease, >0 = disease)
        df['target'] = df['target'].apply(lambda x: 1 if x > 0 else 0)
        # Select only required features
        df = df[['age', 'chol', 'trestbps', 'thalach', 'target']]
        df.columns = ['age', 'chol', 'bp', 'hr', 'target']
    elif dataset_name == "diabetes":
        url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
        names = ['preg', 'plas', 'pres', 'skin', 'test', 'mass', 'pedi', 'age', 'class']
        df = pd.read_csv(url, names=names)
        df.rename(columns={'class': 'target'}, inplace=True)
        # Select only required features
        df = df[['plas', 'mass', 'test', 'age', 'target']]
        df.columns = ['glucose', 'bmi', 'insulin', 'age', 'target']
    elif dataset_name == "breast_cancer":
        data = load_breast_cancer()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        df['target'] = data.target
        # Select only required features
        required = ['mean radius', 'mean texture', 'mean area', 'mean smoothness']
        df = df[required + ['target']]
        df.columns = ['radius', 'texture', 'area', 'smoothness', 'target']
        
    print(f"\n--- Dataset: {dataset_name} ---")
    print(f"Shape: {df.shape}")
    print("\nMissing values:\n", df.isnull().sum())
    
    # Fill missing values with median
    df = df.fillna(df.median())
    
    return df

# --- STEP 2: PREPROCESSING ---
def preprocess_data(df):
    X = df.drop('target', axis=1)
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, X.columns

# --- STEP 4: MODEL BUILDING ---
def train_models(X_train, y_train):
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "SVM": SVC(probability=True, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    }

    # Define Ensemble Model (Voting Classifier)
    estimators = [
        ('lr', models["Logistic Regression"]),
        ('svc', models["SVM"]),
        ('rf', models["Random Forest"]),
        ('xgb', models["XGBoost"])
    ]
    models["Ensemble (Voting)"] = VotingClassifier(estimators=estimators, voting='soft')
    
    trained_models = {}
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        trained_models[name] = model
        
    return trained_models

# --- STEP 5: EVALUATION ---
def evaluate_models(models, X_test, y_test):
    results = []
    for name, model in models.items():
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        
        metrics = {
            "Model": name,
            "Accuracy": accuracy_score(y_test, y_pred),
            "Precision": precision_score(y_test, y_pred),
            "Recall": recall_score(y_test, y_pred),
            "F1 Score": f1_score(y_test, y_pred),
            "ROC-AUC": roc_auc_score(y_test, y_prob)
        }
        results.append(metrics)
        
    return pd.DataFrame(results)

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    # Create models directory
    if not os.path.exists('models'):
        os.makedirs('models')
        
    datasets = ["heart", "diabetes", "breast_cancer"]
    
    for ds_name in datasets:
        print(f"\n{'='*20} Processing {ds_name} {'='*20}")
        try:
            df = load_and_summarize_data(ds_name)
            X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data(df)
            
            trained_models = train_models(X_train, y_train)
            comparison_df = evaluate_models(trained_models, X_test, y_test)
            
            print(f"\n--- {ds_name} Model Comparison ---")
            print(comparison_df.sort_values(by="Accuracy", ascending=False))
            
            # Save the best model
            best_model_name = comparison_df.sort_values(by="Accuracy", ascending=False).iloc[0]['Model']
            best_model = trained_models[best_model_name]
            
            joblib.dump(best_model, f'models/{ds_name}_model.pkl')
            joblib.dump(scaler, f'models/{ds_name}_scaler.pkl')
            
            print(f"Best Model for {ds_name}: {best_model_name}")
        except Exception as e:
            print(f"Error training {ds_name}: {e}")
