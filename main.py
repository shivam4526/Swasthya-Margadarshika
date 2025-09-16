from flask import Flask, request, render_template, jsonify, redirect, url_for, session, flash  # Import additional Flask modules
import numpy as np
import pandas as pd
import pickle
import os
import json
import requests
from gemini_api import generate_health_insights  # Import the Gemini API function
from functools import wraps  # For login_required decorator
from symptom_image_generator import generate_symptom_image, get_symptom_images, find_related_symptoms
from api_integration import get_diagnosis, get_medications, get_combined_health_data, clear_cache


# flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management

# Demo user for authentication
DEMO_USER = {
    'email': 'demo@example.com',
    'password': 'password123',
    'name': 'Demo User'
}

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function



# load databasedataset===================================
sym_des = pd.read_csv("datasets/symtoms_df.csv")
precautions = pd.read_csv("datasets/precautions_df.csv")
workout = pd.read_csv("datasets/workout_df.csv")
description = pd.read_csv("datasets/description.csv")
medications = pd.read_csv('datasets/medications.csv')
diets = pd.read_csv("datasets/diets.csv")


# load model===========================================
svc = pickle.load(open('models/.ipynb_checkpoints/svc.pkl', 'rb'))


#============================================================
# custom and helping functions
#==========================helper functions================

# Debug function to print variable types and content
def debug_variables(variables_dict):
    print("\n===== DEBUG INFORMATION =====")
    for name, value in variables_dict.items():
        print(f"{name}:")
        print(f"  Type: {type(value)}")
        if isinstance(value, list):
            print(f"  Length: {len(value)}")
            if len(value) > 0:
                print(f"  First item type: {type(value[0])}")
                print(f"  First item: {value[0]}")
        elif hasattr(value, 'shape'):  # For numpy arrays and pandas Series/DataFrames
            print(f"  Shape: {value.shape}")
        print(f"  Value: {value}")
    print("===== END DEBUG INFO =====\n")
def helper(dis):
    # Get description and convert to string
    desc_series = description[description['Disease'] == dis]['Description']
    desc = "No description available"
    if not desc_series.empty:
        desc = " ".join([str(w) for w in desc_series])

    # Get precautions and convert to list of strings
    pre_df = precautions[precautions['Disease'] == dis][['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']]
    pre = []
    if not pre_df.empty:
        # Extract values from DataFrame
        pre_values = pre_df.values
        if len(pre_values) > 0:
            # Convert each value to string and add to list
            pre = [[str(item) for item in row if pd.notna(item) and str(item).strip()] for row in pre_values]
            # Flatten if needed
            if pre and len(pre) == 1:
                pre = pre[0]

    # Get medications and convert to list of strings
    med_series = medications[medications['Disease'] == dis]['Medication']
    med = []
    if not med_series.empty:
        # Convert each medication to string and add to list
        med = [str(item) for item in med_series.values if pd.notna(item) and str(item).strip()]

    # Get diet recommendations and convert to list of strings
    diet_series = diets[diets['Disease'] == dis]['Diet']
    die = []
    if not diet_series.empty:
        # Convert each diet item to string and add to list
        die = [str(item) for item in diet_series.values if pd.notna(item) and str(item).strip()]

    # Get workout recommendations and convert to list of strings
    wrkout_series = workout[workout['disease'] == dis]['workout']
    wrkout = []
    if not wrkout_series.empty:
        # Convert each workout to string and add to list
        wrkout = [str(item) for item in wrkout_series.values if pd.notna(item) and str(item).strip()]

    # Print for debugging
    print(f"Disease: {dis}")
    print(f"Description: {desc}")
    print(f"Precautions: {pre}")
    print(f"Medications: {med}")
    print(f"Diet: {die}")
    print(f"Workout: {wrkout}")

    return desc, pre, med, die, wrkout

symptoms_dict = {'itching': 0, 'skin_rash': 1, 'nodal_skin_eruptions': 2, 'continuous_sneezing': 3, 'shivering': 4, 'chills': 5, 'joint_pain': 6, 'stomach_pain': 7, 'acidity': 8, 'ulcers_on_tongue': 9, 'muscle_wasting': 10, 'vomiting': 11, 'burning_micturition': 12, 'spotting_ urination': 13, 'fatigue': 14, 'weight_gain': 15, 'anxiety': 16, 'cold_hands_and_feets': 17, 'mood_swings': 18, 'weight_loss': 19, 'restlessness': 20, 'lethargy': 21, 'patches_in_throat': 22, 'irregular_sugar_level': 23, 'cough': 24, 'high_fever': 25, 'sunken_eyes': 26, 'breathlessness': 27, 'sweating': 28, 'dehydration': 29, 'indigestion': 30, 'headache': 31, 'yellowish_skin': 32, 'dark_urine': 33, 'nausea': 34, 'loss_of_appetite': 35, 'pain_behind_the_eyes': 36, 'back_pain': 37, 'constipation': 38, 'abdominal_pain': 39, 'diarrhoea': 40, 'mild_fever': 41, 'yellow_urine': 42, 'yellowing_of_eyes': 43, 'acute_liver_failure': 44, 'fluid_overload': 45, 'swelling_of_stomach': 46, 'swelled_lymph_nodes': 47, 'malaise': 48, 'blurred_and_distorted_vision': 49, 'phlegm': 50, 'throat_irritation': 51, 'redness_of_eyes': 52, 'sinus_pressure': 53, 'runny_nose': 54, 'congestion': 55, 'chest_pain': 56, 'weakness_in_limbs': 57, 'fast_heart_rate': 58, 'pain_during_bowel_movements': 59, 'pain_in_anal_region': 60, 'bloody_stool': 61, 'irritation_in_anus': 62, 'neck_pain': 63, 'dizziness': 64, 'cramps': 65, 'bruising': 66, 'obesity': 67, 'swollen_legs': 68, 'swollen_blood_vessels': 69, 'puffy_face_and_eyes': 70, 'enlarged_thyroid': 71, 'brittle_nails': 72, 'swollen_extremeties': 73, 'excessive_hunger': 74, 'extra_marital_contacts': 75, 'drying_and_tingling_lips': 76, 'slurred_speech': 77, 'knee_pain': 78, 'hip_joint_pain': 79, 'muscle_weakness': 80, 'stiff_neck': 81, 'swelling_joints': 82, 'movement_stiffness': 83, 'spinning_movements': 84, 'loss_of_balance': 85, 'unsteadiness': 86, 'weakness_of_one_body_side': 87, 'loss_of_smell': 88, 'bladder_discomfort': 89, 'foul_smell_of urine': 90, 'continuous_feel_of_urine': 91, 'passage_of_gases': 92, 'internal_itching': 93, 'toxic_look_(typhos)': 94, 'depression': 95, 'irritability': 96, 'muscle_pain': 97, 'altered_sensorium': 98, 'red_spots_over_body': 99, 'belly_pain': 100, 'abnormal_menstruation': 101, 'dischromic _patches': 102, 'watering_from_eyes': 103, 'increased_appetite': 104, 'polyuria': 105, 'family_history': 106, 'mucoid_sputum': 107, 'rusty_sputum': 108, 'lack_of_concentration': 109, 'visual_disturbances': 110, 'receiving_blood_transfusion': 111, 'receiving_unsterile_injections': 112, 'coma': 113, 'stomach_bleeding': 114, 'distention_of_abdomen': 115, 'history_of_alcohol_consumption': 116, 'fluid_overload.1': 117, 'blood_in_sputum': 118, 'prominent_veins_on_calf': 119, 'palpitations': 120, 'painful_walking': 121, 'pus_filled_pimples': 122, 'blackheads': 123, 'scurring': 124, 'skin_peeling': 125, 'silver_like_dusting': 126, 'small_dents_in_nails': 127, 'inflammatory_nails': 128, 'blister': 129, 'red_sore_around_nose': 130, 'yellow_crust_ooze': 131}
diseases_list = {15: 'Fungal infection', 4: 'Allergy', 16: 'GERD', 9: 'Chronic cholestasis', 14: 'Drug Reaction', 33: 'Peptic ulcer diseae', 1: 'AIDS', 12: 'Diabetes ', 17: 'Gastroenteritis', 6: 'Bronchial Asthma', 23: 'Hypertension ', 30: 'Migraine', 7: 'Cervical spondylosis', 32: 'Paralysis (brain hemorrhage)', 28: 'Jaundice', 29: 'Malaria', 8: 'Chicken pox', 11: 'Dengue', 37: 'Typhoid', 40: 'hepatitis A', 19: 'Hepatitis B', 20: 'Hepatitis C', 21: 'Hepatitis D', 22: 'Hepatitis E', 3: 'Alcoholic hepatitis', 36: 'Tuberculosis', 10: 'Common Cold', 34: 'Pneumonia', 13: 'Dimorphic hemmorhoids(piles)', 18: 'Heart attack', 39: 'Varicose veins', 26: 'Hypothyroidism', 24: 'Hyperthyroidism', 25: 'Hypoglycemia', 31: 'Osteoarthristis', 5: 'Arthritis', 0: '(vertigo) Paroymsal  Positional Vertigo', 2: 'Acne', 38: 'Urinary tract infection', 35: 'Psoriasis', 27: 'Impetigo'}

# Model Prediction function
def get_predicted_value(patient_symptoms):
    # Check if all symptoms are in our dataset
    valid_symptoms = True
    for symptom in patient_symptoms:
        if symptom not in symptoms_dict:
            valid_symptoms = False
            break

    # If all symptoms are valid, use our trained model
    if valid_symptoms and patient_symptoms:
        input_vector = np.zeros(len(symptoms_dict))
        for item in patient_symptoms:
            input_vector[symptoms_dict[item]] = 1
        return diseases_list[svc.predict([input_vector])[0]], True
    else:
        # Return None to indicate we need to use Gemini API
        return None, False




# creating routes========================================

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('index'))

    error = None
    message = None

    # Check if there's a next parameter (for redirecting after login)
    next_url = request.args.get('next')

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Get the next URL from the form submission
        form_next_url = request.form.get('next_url')
        if form_next_url:
            next_url = form_next_url

        # Check if it's the demo user
        if email == DEMO_USER['email'] and password == DEMO_USER['password']:
            session['user_id'] = email
            session['user_name'] = DEMO_USER['name']
            flash('You have been logged in successfully!', 'success')

            # Redirect to the next URL if it exists, otherwise to the index
            if next_url:
                return redirect(next_url)
            return redirect(url_for('index'))
        else:
            # For demo purposes, accept any email/password with minimal validation
            if email and password and len(password) >= 6:
                session['user_id'] = email
                session['user_name'] = email.split('@')[0].title()  # Use part of email as name
                flash('You have been logged in successfully!', 'success')

                # Redirect to the next URL if it exists, otherwise to the index
                if next_url:
                    return redirect(next_url)
                return redirect(url_for('index'))
            else:
                error = 'Invalid credentials. Please try again.'

    return render_template('login.html', error=error, message=message, next_url=next_url)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('index'))

    error = None

    # Check if there's a next parameter (for redirecting after registration)
    next_url = request.args.get('next')

    if request.method == 'POST':
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')

        # Get the next URL from the form submission
        form_next_url = request.form.get('next_url')
        if form_next_url:
            next_url = form_next_url

        # Basic validation
        if not all([first_name, last_name, email, password, confirm_password]):
            error = 'All fields are required.'
        elif password != confirm_password:
            error = 'Passwords do not match.'
        elif len(password) < 6:
            error = 'Password must be at least 6 characters.'
        else:
            # In a real app, we would save the user to a database
            # For this demo, we'll just log them in
            session['user_id'] = email
            session['user_name'] = f"{first_name} {last_name}"
            flash('Account created successfully!', 'success')

            # Redirect to the next URL if it exists, otherwise to the index
            if next_url:
                return redirect(next_url)
            return redirect(url_for('index'))

    return render_template('register.html', error=error, next_url=next_url)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    flash('You have been logged out successfully!', 'success')
    return redirect(url_for('login'))

@app.route("/")
def index():
    # If user is not logged in, redirect to login page
    if 'user_id' not in session:
        return redirect(url_for('login'))

    # If user is logged in, show the main page
    user_name = session.get('user_name')
    return render_template("index.html", user_name=user_name)

# Define a route for the home page
@app.route('/predict', methods=['GET', 'POST'])
@login_required
def home():
    if request.method == 'POST':
        symptoms = request.form.get('symptoms')
        print(f"Received symptoms: {symptoms}")

        # Save the search to session for use in profile page
        if symptoms and symptoms.strip() != "Symptoms":
            session['last_search'] = symptoms

        if not symptoms or symptoms == "Symptoms":
            message = "Please enter valid symptoms to get a diagnosis"
            return render_template('index.html', message=message)
        else:
            # Split the user's input into a list of symptoms (assuming they are comma-separated)
            user_symptoms = [s.strip() for s in symptoms.split(',')]
            # Remove any extra characters, if any
            user_symptoms = [symptom.strip("[]' ") for symptom in user_symptoms if symptom.strip("[]' ")]

            # Normalize symptoms for better matching
            normalized_symptoms = []
            for symptom in user_symptoms:
                # Convert to lowercase and standardize format
                normalized = symptom.lower().strip()
                if normalized and normalized not in [s.lower() for s in normalized_symptoms]:
                    normalized_symptoms.append(symptom)

            user_symptoms = normalized_symptoms
            print(f"Normalized symptoms: {user_symptoms}")

            # Try to get combined health data from APIs first
            try:
                # Use all symptoms for API calls to get the most comprehensive results
                api_data = get_combined_health_data(tuple(user_symptoms))
                print(f"API data received: {api_data.keys()}")

                # Check if we got a valid condition from the API
                api_condition = api_data.get("condition")

                # If we have API data with a condition, use it
                if api_condition:
                    print(f"Using API condition: {api_condition}")
                    predicted_disease = api_condition
                    dis_des = api_data.get("insights", {}).get("description", "No description available")

                    # Get precautions from API insights
                    precautions_list = api_data.get("insights", {}).get("precautions", [])
                    if not precautions_list:
                        precautions_list = ["Consult a healthcare professional for specific precautions"]

                    # Get medications from API data
                    med_list = []
                    api_medications = api_data.get("medications", [])
                    if api_medications:
                        for med in api_medications:
                            if isinstance(med, dict) and "name" in med:
                                med_info = f"{med['name']}"
                                if "indications" in med:
                                    med_info += f" - {med['indications'][:100]}..."
                                med_list.append(med_info)

                    if not med_list:
                        med_list = ["Consult a healthcare professional for medication recommendations"]

                    # Get diet and workout recommendations from API insights
                    diet_list = api_data.get("insights", {}).get("lifestyle", [])
                    if not diet_list:
                        diet_list = ["Maintain a balanced diet rich in fruits, vegetables, and whole grains"]

                    workout_list = api_data.get("insights", {}).get("treatments", [])
                    if not workout_list:
                        workout_list = ["Light activity as tolerated, consult with a healthcare professional"]

                    # Set flag to indicate this is from API
                    ai_generated = True

                    # Return the template with API data
                    return render_template('index.html',
                                          predicted_disease=predicted_disease,
                                          dis_des=dis_des,
                                          my_precautions=precautions_list,
                                          medications=med_list,
                                          my_diet=diet_list,
                                          workout=workout_list,
                                          ai_generated=ai_generated)
            except Exception as e:
                print(f"Error getting API data: {e}")
                # Continue with the model prediction if API fails

            # Try to predict using our model as a fallback
            predicted_disease, model_success = get_predicted_value(user_symptoms)

            if model_success:
                # Use our trained model's prediction
                dis_des, precautions, medications, rec_diet, workout = helper(predicted_disease)

                # Ensure all data is properly formatted for the template

                # Handle precautions
                my_precautions = []
                if isinstance(precautions, list) and precautions:
                    # If it's a nested list, flatten it
                    if isinstance(precautions[0], list):
                        for item in precautions[0]:
                            if item and str(item).strip():
                                my_precautions.append(str(item))
                    else:
                        # If it's a flat list
                        for item in precautions:
                            if item and str(item).strip():
                                my_precautions.append(str(item))

                # Handle medications
                med_list = []
                if isinstance(medications, list) and medications:
                    for med in medications:
                        if hasattr(med, 'tolist'):  # If it's a numpy array
                            med_list.extend([str(m) for m in med.tolist() if m and str(m).strip()])
                        elif med and str(med).strip():
                            med_list.append(str(med))

                # Handle diet recommendations
                diet_list = []
                if isinstance(rec_diet, list) and rec_diet:
                    for diet in rec_diet:
                        if hasattr(diet, 'tolist'):  # If it's a numpy array
                            diet_list.extend([str(d) for d in diet.tolist() if d and str(d).strip()])
                        elif diet and str(diet).strip():
                            diet_list.append(str(diet))

                # Handle workout recommendations
                workout_list = []
                if isinstance(workout, list) and workout:
                    for w in workout:
                        if hasattr(w, 'tolist'):  # If it's a numpy array
                            workout_list.extend([str(item) for item in w.tolist() if item and str(item).strip()])
                        elif w and str(w).strip():
                            workout_list.append(str(w))

                # Use debug function for detailed debugging
                debug_variables({
                    'predicted_disease': predicted_disease,
                    'dis_des': dis_des,
                    'my_precautions': my_precautions,
                    'medications': med_list,
                    'diet': diet_list,
                    'workout': workout_list
                })

                return render_template('index.html', predicted_disease=predicted_disease, dis_des=dis_des,
                                    my_precautions=my_precautions, medications=med_list, my_diet=diet_list,
                                    workout=workout_list)
            else:
                # Use Gemini API for symptoms that don't match our dataset
                try:
                    print(f"Using Gemini API for symptoms: {user_symptoms}")
                    health_data = generate_health_insights(user_symptoms)

                    # Extract data from the Gemini API response
                    predicted_disease = health_data.get('disease', 'Unknown condition')
                    dis_des = health_data.get('description', 'No description available')
                    my_precautions = health_data.get('precautions', ['Consult a healthcare professional'])
                    medications = health_data.get('medications', ['Consult a healthcare professional'])
                    rec_diet = health_data.get('diet', ['Maintain a balanced diet'])
                    workout = health_data.get('workouts', ['Light activity as tolerated'])

                    # Add a note that this prediction is from AI
                    ai_generated = True

                    # Log the successful response
                    print(f"Successfully generated health insights for: {user_symptoms}")
                    print(f"Predicted disease: {predicted_disease}")
                except Exception as e:
                    # Handle any unexpected errors
                    print(f"Error processing health insights: {e}")

                    # Use our enhanced fallback mechanism from gemini_api.py
                    # This will provide symptom-specific information when possible
                    from gemini_api import create_fallback_response
                    fallback_data = create_fallback_response(user_symptoms, str(e))

                    predicted_disease = fallback_data.get('disease', 'Symptom Analysis')
                    dis_des = fallback_data.get('description', f"We analyzed your symptoms but couldn't process your request through our advanced system.")
                    my_precautions = fallback_data.get('precautions', ["Consult a healthcare professional"])
                    medications = fallback_data.get('medications', ["Consult with a healthcare professional"])
                    rec_diet = fallback_data.get('diet', ["Maintain a balanced diet"])
                    workout = fallback_data.get('workouts', ["Light activity as tolerated"])
                    ai_generated = True

                # Ensure all data is properly formatted for the template

                # Ensure my_precautions is a list of strings
                precautions_list = []
                if isinstance(my_precautions, list) and my_precautions:
                    precautions_list = [str(p) for p in my_precautions if p and str(p).strip()]
                elif my_precautions and str(my_precautions).strip():
                    precautions_list = [str(my_precautions)]

                # Ensure medications is a list of strings
                med_list = []
                if isinstance(medications, list) and medications:
                    med_list = [str(m) for m in medications if m and str(m).strip()]
                elif medications and str(medications).strip():
                    med_list = [str(medications)]

                # Ensure diet recommendations is a list of strings
                diet_list = []
                if isinstance(rec_diet, list) and rec_diet:
                    diet_list = [str(d) for d in rec_diet if d and str(d).strip()]
                elif rec_diet and str(rec_diet).strip():
                    diet_list = [str(rec_diet)]

                # Ensure workout recommendations is a list of strings
                workout_list = []
                if isinstance(workout, list) and workout:
                    workout_list = [str(w) for w in workout if w and str(w).strip()]
                elif workout and str(workout).strip():
                    workout_list = [str(workout)]

                # Use debug function for detailed debugging of Gemini API data
                debug_variables({
                    'predicted_disease': predicted_disease,
                    'dis_des': dis_des,
                    'precautions_list': precautions_list,
                    'medications': med_list,
                    'diet': diet_list,
                    'workout': workout_list,
                    'ai_generated': ai_generated
                })

                return render_template('index.html', predicted_disease=predicted_disease, dis_des=dis_des,
                                    my_precautions=precautions_list, medications=med_list, my_diet=diet_list,
                                    workout=workout_list, ai_generated=ai_generated)

    return render_template('index.html')



# about view funtion and path
@app.route('/about')
def about():
    return render_template("about.html")

# contact view funtion and path
@app.route('/contact')
def contact():
    return render_template("contact.html")

# developer view funtion and path
@app.route('/developer')
def developer():
    return render_template("developer.html")

# blog view funtion and path
@app.route('/blog')
def blog():
    return render_template("blog.html")

# profile view function and path
@app.route('/profile')
@login_required
def profile():
    user_name = session.get('user_name')

    # In a real app, you would fetch user details from a database
    # For demo purposes, we'll just use the session data and some defaults
    user_data = {
        'user_name': user_name,
        'email': session.get('user_id'),
        'join_date': 'January 2023',  # Demo data
        'first_name': user_name.split()[0] if user_name and ' ' in user_name else user_name,
        'last_name': user_name.split()[1] if user_name and ' ' in user_name else '',
    }

    # For recent searches, we'll use the most recent search from the session if available
    # In a real app, this would come from a database
    recent_searches = []
    if 'last_search' in session and session['last_search']:
        recent_searches = [session['last_search']]

    return render_template("profile.html", **user_data, recent_searches=recent_searches)

# settings view function and path
@app.route('/settings')
@login_required
def settings():
    user_name = session.get('user_name')
    return render_template("settings.html", user_name=user_name)


# API routes for symptom image generation and external API integration
@app.route('/api/symptom-images', methods=['GET', 'POST'])
@login_required
def symptom_images_api():
    """API endpoint to get symptom images based on user input with pagination support"""
    if request.method == 'POST':
        data = request.get_json()
        input_text = data.get('input', '')
        offset = data.get('offset', 0)  # For pagination
        count = data.get('count', 8)    # Number of images to return

        # Process the input text to extract symptoms
        if input_text:
            # Split by common separators and clean up
            user_symptoms = [s.strip() for s in input_text.replace(',', ' ').replace(';', ' ').split()]
            user_symptoms = [s for s in user_symptoms if s]
        else:
            user_symptoms = []

        # Get images for these symptoms and related ones
        all_symptoms = list(symptoms_dict.keys())

        # If no symptoms provided, return some common ones
        if not user_symptoms:
            # For pagination, we need to get more symptoms than just the first 8
            if offset > 0:
                # Get a larger set of common symptoms
                common_symptoms = list(symptoms_dict.keys())
                # Sort by frequency or importance (you could customize this)
                common_symptoms.sort()
                # Apply offset and count
                paginated_symptoms = common_symptoms[offset:offset+count]
                result = get_symptom_images(paginated_symptoms, count=count)
            else:
                # Initial request, return the first set
                result = get_symptom_images([], count=count)
        else:
            # Find matching and related symptoms
            matched_symptoms = []

            # First, find exact matches
            for input_symptom in user_symptoms:
                exact_matches = [s for s in all_symptoms if input_symptom.lower() in s.lower()]
                matched_symptoms.extend(exact_matches)

            # Then, find related symptoms for each input
            for input_symptom in user_symptoms:
                related = find_related_symptoms(input_symptom, all_symptoms, max_count=5)
                matched_symptoms.extend(related)

            # Remove duplicates while preserving order
            unique_symptoms = []
            for s in matched_symptoms:
                if s not in unique_symptoms:
                    unique_symptoms.append(s)

            # If we don't have enough symptoms, add some common ones
            if len(unique_symptoms) < offset + count:
                common_symptoms = list(symptoms_dict.keys())
                # Filter out symptoms already in the result
                additional_symptoms = [s for s in common_symptoms if s not in unique_symptoms]
                unique_symptoms.extend(additional_symptoms)

            # Apply pagination
            paginated_symptoms = unique_symptoms[offset:offset+count]

            # Get images for these symptoms
            result = get_symptom_images(paginated_symptoms, count=count)

        return jsonify({"images": result})

    # For GET requests, return some common symptom images
    result = get_symptom_images([], count=8)
    return jsonify({"images": result})

@app.route('/api/diagnosis', methods=['POST'])
@login_required
def diagnosis_api():
    """API endpoint to get diagnosis from RapidAPI with caching"""
    data = request.get_json()
    symptoms = data.get('symptoms', [])

    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    # Use the optimized API integration with caching
    try:
        diagnosis_data = get_diagnosis(tuple(symptoms))  # Convert to tuple for lru_cache
        return jsonify(diagnosis_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/medications', methods=['POST'])
@login_required
def medications_api():
    """API endpoint to get medication information from OpenFDA API with caching"""
    data = request.get_json()
    condition = data.get('condition', '')

    if not condition:
        return jsonify({"error": "No condition provided"}), 400

    # Use the optimized API integration with caching
    try:
        medication_data = get_medications(condition)
        return jsonify(medication_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health-data', methods=['POST'])
@login_required
def health_data_api():
    """API endpoint to get combined health data from multiple APIs with caching"""
    data = request.get_json()
    symptoms = data.get('symptoms', [])

    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    # Use the optimized API integration with caching
    try:
        combined_data = get_combined_health_data(tuple(symptoms))  # Convert to tuple for lru_cache
        return jsonify(combined_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clear-cache', methods=['POST'])
@login_required
def clear_cache_api():
    """API endpoint to clear the API cache"""
    try:
        clear_cache()
        return jsonify({"message": "API cache cleared successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)