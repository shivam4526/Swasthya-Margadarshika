import requests
import json
import os
import re

# You should set this as an environment variable for security
# For now, we'll keep it in the code for simplicity
#insert your own gemini api
API_KEY = ""
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# Play.ht API key for text-to-speech
PLAY_HT_API_KEY = "ak-f1b8973f03ee4e11a0b38f85120ca01c"

def generate_health_insights(symptoms):
    """
    Generate health insights using Gemini API based on symptoms that don't match our dataset.

    Args:
        symptoms (list): List of symptoms entered by the user

    Returns:
        dict: Dictionary containing structured health information
    """
    # Format symptoms for the prompt
    symptoms_text = ", ".join(symptoms)

    # Create the prompt for Gemini API
    prompt = f"""Based on these symptoms: {symptoms_text}, generate relevant health insights.
    Predict the most likely disease or health condition, and provide structured content across the following domains:
    1. Disease Name
    2. Description
    3. Precautions to take (provide as a list of 4 items)
    4. Recommended Medications (non-prescriptive, provide as a list)
    5. Suggested Workouts or Exercises (provide as a list)
    6. Appropriate Diet Plans (provide as a list)

    Ensure the content is medically reasonable, concise, and user-friendly. Each section should be clearly separated.
    Avoid repeating the input and do not hallucinate critical medical details — prioritize accuracy and practical advice.
    Format your response as a JSON object with the following keys: disease, description, precautions, medications, workouts, diet.

    IMPORTANT: Your response MUST be a valid JSON object with these exact keys. Do not include any text outside the JSON object.
    """

    # Prepare the request payload
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.4,
            "topK": 32,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }

    # Add API key to the URL
    url = f"{API_URL}?key={API_KEY}"

    try:
        # Make the API request
        response = requests.post(url, json=payload, timeout=10)  # Add timeout for better error handling
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Parse the response
        result = response.json()

        # Extract the generated text
        generated_text = result['candidates'][0]['content']['parts'][0]['text']

        # Try to parse the JSON response
        try:
            # Find JSON content in the response (it might be wrapped in markdown code blocks)
            if "```json" in generated_text:
                json_text = generated_text.split("```json")[1].split("```")[0].strip()
            elif "```" in generated_text:
                json_text = generated_text.split("```")[1].split("```")[0].strip()
            else:
                # Try to extract JSON using regex pattern matching
                json_pattern = r'\{[\s\S]*\}'
                match = re.search(json_pattern, generated_text)
                if match:
                    json_text = match.group(0)
                else:
                    json_text = generated_text

            # Parse the JSON
            health_data = json.loads(json_text)

            # Ensure all required keys are present and properly formatted
            required_keys = ['disease', 'description', 'precautions', 'medications', 'workouts', 'diet']
            for key in required_keys:
                if key not in health_data:
                    health_data[key] = ["Information not available"] if key != 'disease' and key != 'description' else "Information not available"
                # Ensure list values are actually lists
                if key in ['precautions', 'medications', 'workouts', 'diet'] and not isinstance(health_data[key], list):
                    # If it's a string, convert to a list with one item
                    if isinstance(health_data[key], str):
                        health_data[key] = [health_data[key]]
                    else:
                        health_data[key] = ["Information not available"]

            return health_data

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            # If JSON parsing fails, create a structured response based on symptoms
            return create_fallback_response(symptoms, f"JSON parsing error: {str(e)}")

    except requests.exceptions.RequestException as e:
        # Handle API request errors
        print(f"API request error: {e}")
        return create_fallback_response(symptoms, f"API request error: {str(e)}")
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in generate_health_insights: {e}")
        return create_fallback_response(symptoms, f"Unexpected error: {str(e)}")


def create_fallback_response(symptoms, error_message=None):
    """
    Create a fallback response when the API fails or returns invalid data.
    Tailors the response based on the provided symptoms.

    Args:
        symptoms (list): List of symptoms entered by the user
        error_message (str, optional): The error message for logging purposes

    Returns:
        dict: A structured health information response
    """
    if error_message:
        print(f"Creating fallback response due to: {error_message}")

    symptom_count = len(symptoms)

    # Map common symptoms to potential conditions for more relevant fallback responses
    common_symptom_map = {
        "itching": {
            "disease": "Possible Skin Condition",
            "description": "Itching can be associated with various skin conditions including allergic reactions, eczema, or fungal infections.",
            "precautions": ["Avoid scratching the affected area", "Keep the skin moisturized", "Wear loose-fitting clothing", "Avoid known irritants"],
            "medications": ["Antihistamines may help reduce itching", "Hydrocortisone cream for inflammation", "Antifungal cream if fungal infection is suspected"],
            "workouts": ["Regular exercise that doesn't irritate the skin", "Swimming in clean water may help some skin conditions"],
            "diet": ["Foods rich in omega-3 fatty acids", "Avoid potential food allergens", "Stay well hydrated"]
        },
        "fever": {
            "disease": "Possible Infection",
            "description": "Fever is often a sign that your body is fighting an infection. It could be viral, bacterial, or due to other causes.",
            "precautions": ["Rest and get plenty of sleep", "Stay hydrated", "Monitor temperature regularly", "Seek medical attention if fever is high or persistent"],
            "medications": ["Acetaminophen (Tylenol) may help reduce fever", "Ibuprofen (Advil) can help with fever and discomfort"],
            "workouts": ["Rest until fever subsides", "Light walking when recovering"],
            "diet": ["Clear broths and soups", "Stay well hydrated", "Easily digestible foods"]
        },
        "headache": {
            "disease": "Tension Headache or Migraine",
            "description": "Headaches can be caused by stress, dehydration, eye strain, or may indicate other conditions.",
            "precautions": ["Rest in a quiet, dark room", "Apply cold or warm compress", "Maintain regular sleep schedule", "Manage stress levels"],
            "medications": ["Over-the-counter pain relievers like acetaminophen or ibuprofen", "Migraine-specific medications if prescribed"],
            "workouts": ["Gentle yoga or stretching", "Walking in fresh air", "Avoid high-intensity exercise during headache"],
            "diet": ["Stay well hydrated", "Avoid known trigger foods", "Regular, balanced meals"]
        }
    }

    # Check if any of the symptoms match our common symptom map
    for symptom in symptoms:
        normalized_symptom = symptom.lower().strip()
        for key in common_symptom_map.keys():
            if key in normalized_symptom:
                # Return the specific response for this symptom
                return common_symptom_map[key]

    # If no specific matches, provide a general response based on symptoms
    if symptom_count > 0:
        symptom_text = ", ".join(symptoms[:3])
        if len(symptoms) > 3:
            symptom_text += ", and others"

        return {
            'disease': "Symptom Analysis",
            'description': f"We analyzed your symptoms ({symptom_text}). These symptoms could be associated with several common conditions. Please note this is not a diagnosis and you should consult a healthcare professional for proper evaluation.",
            'precautions': ["Rest and stay hydrated", "Monitor your symptoms", "Take over-the-counter pain relievers if appropriate", "Consult a healthcare professional if symptoms persist or worsen"],
            'medications': ["Over-the-counter pain relievers may help with discomfort", "Consult with a healthcare professional before taking any medication"],
            'workouts': ["Light walking if feeling up to it", "Gentle stretching", "Rest is important when experiencing symptoms"],
            'diet': ["Stay well hydrated", "Consume easily digestible foods", "Consider vitamin-rich foods to support immune function"]
        }
    else:
        # Generic fallback if no symptoms were provided
        return {
            'disease': "Health Information",
            'description': "For accurate health information, please provide specific symptoms or consult a healthcare professional.",
            'precautions': ["Consult a healthcare professional for proper medical advice", "Monitor any symptoms you may be experiencing", "Rest and stay hydrated", "Seek medical attention if symptoms worsen"],
            'medications': ["Consult with a healthcare professional for appropriate medication recommendations"],
            'workouts': ["Regular moderate exercise is beneficial for overall health", "Always consult a professional before starting new exercise routines"],
            'diet': ["Maintain a balanced diet rich in fruits and vegetables", "Stay hydrated", "Limit processed foods and sugar intake"]
        }
