import requests
import json
import time
import os
import hashlib
from functools import lru_cache

# API Keys
RAPIDAPI_KEY = "37ea18fb2fmsh75430a0c01b2db3p1a2365jsn7c6dedeadc24"
OPENFDA_KEY = "ehUnJPRUtRacmeYur4XSxQzXN83iUYeMb1Me3dph"

# Cache settings
CACHE_DIR = "api_cache"
CACHE_EXPIRATION = 86400  # 24 hours in seconds

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_path(endpoint, params):
    """
    Generate a cache file path based on the endpoint and parameters.

    Args:
        endpoint (str): API endpoint
        params (dict): API parameters

    Returns:
        str: Path to the cache file
    """
    # Create a unique hash based on the endpoint and parameters
    param_str = json.dumps(params, sort_keys=True)
    hash_obj = hashlib.md5((endpoint + param_str).encode())
    hash_str = hash_obj.hexdigest()

    return os.path.join(CACHE_DIR, f"{hash_str}.json")

def is_cache_valid(cache_path):
    """
    Check if a cache file exists and is not expired.

    Args:
        cache_path (str): Path to the cache file

    Returns:
        bool: True if cache is valid, False otherwise
    """
    if not os.path.exists(cache_path):
        return False

    # Check if the cache is expired
    file_time = os.path.getmtime(cache_path)
    current_time = time.time()

    return (current_time - file_time) < CACHE_EXPIRATION

def read_cache(cache_path):
    """
    Read data from a cache file.

    Args:
        cache_path (str): Path to the cache file

    Returns:
        dict: Cached data
    """
    try:
        with open(cache_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return None

def write_cache(cache_path, data):
    """
    Write data to a cache file.

    Args:
        cache_path (str): Path to the cache file
        data (dict): Data to cache
    """
    with open(cache_path, 'w') as f:
        json.dump(data, f)

@lru_cache(maxsize=100)
def get_diagnosis(symptoms):
    """
    Get diagnosis information from RapidAPI with caching.

    Args:
        symptoms (list): List of symptoms

    Returns:
        dict: Diagnosis information
    """
    # Normalize symptoms (remove underscores, standardize format)
    normalized_symptoms = []
    for symptom in symptoms:
        # Convert underscores to spaces and standardize format
        normalized = symptom.replace('_', ' ').lower().strip()
        if normalized and normalized not in normalized_symptoms:
            normalized_symptoms.append(normalized)

    # Convert symptoms list to string for API
    symptoms_str = ",".join(normalized_symptoms)

    # If no symptoms provided, return empty result
    if not symptoms_str:
        return {"diagnosis": [], "error": "No valid symptoms provided"}

    # Define API endpoint and parameters
    endpoint = "https://diagnosis.p.rapidapi.com/diagnosis"
    params = {"symptoms": symptoms_str}

    # Generate cache path
    cache_path = get_cache_path(endpoint, params)

    # Check if we have a valid cache
    if is_cache_valid(cache_path):
        cached_data = read_cache(cache_path)
        if cached_data:
            print(f"Using cached diagnosis data for symptoms: {symptoms_str}")
            return cached_data

    # If no valid cache, make the API request
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "diagnosis.p.rapidapi.com"
    }

    try:
        print(f"Fetching diagnosis data for symptoms: {symptoms_str}")
        response = requests.get(
            endpoint,
            headers=headers,
            params=params,
            timeout=15  # Increased timeout for reliability
        )

        # Check if the request was successful
        if response.status_code == 200:
            try:
                data = response.json()

                # Validate and process the response
                if "diagnosis" not in data or not isinstance(data["diagnosis"], list):
                    # If the API response doesn't have the expected format, create a structured response
                    data = {
                        "diagnosis": [],
                        "api_response": data,  # Store the original response
                        "message": "Received unexpected response format from API"
                    }

                # Cache the response
                write_cache(cache_path, data)

                return data
            except ValueError as e:
                print(f"Error parsing JSON response: {e}")
                return {"error": "Invalid JSON response from API", "diagnosis": []}
        else:
            error_message = f"API error: {response.status_code}"
            try:
                error_data = response.json()
                if isinstance(error_data, dict) and "message" in error_data:
                    error_message = f"API error: {error_data['message']}"
            except:
                pass

            print(error_message)
            return {"error": error_message, "diagnosis": []}

    except Exception as e:
        print(f"Error fetching diagnosis: {e}")
        return {"error": str(e), "diagnosis": []}

@lru_cache(maxsize=100)
def get_medications(condition):
    """
    Get medication information from OpenFDA API with caching.

    Args:
        condition (str): Medical condition to search for

    Returns:
        dict: Medication information
    """
    # Define API endpoint and parameters
    endpoint = "https://api.fda.gov/drug/label.json"
    params = {
        "search": f"indications_and_usage:{condition}",
        "limit": 5,
        "api_key": OPENFDA_KEY
    }

    # Generate cache path
    cache_path = get_cache_path(endpoint, params)

    # Check if we have a valid cache
    if is_cache_valid(cache_path):
        cached_data = read_cache(cache_path)
        if cached_data:
            print(f"Using cached medication data for condition: {condition}")
            return cached_data

    # If no valid cache, make the API request
    try:
        print(f"Fetching medication data for condition: {condition}")
        response = requests.get(
            endpoint,
            params=params,
            timeout=10
        )

        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()

            # Process the data to extract relevant information
            processed_data = process_medication_data(data)

            # Cache the processed response
            write_cache(cache_path, processed_data)

            return processed_data
        else:
            print(f"API error: {response.status_code}")
            return {"error": f"API error: {response.status_code}"}

    except Exception as e:
        print(f"Error fetching medications: {e}")
        return {"error": str(e)}

def process_medication_data(data):
    """
    Process medication data from OpenFDA API to extract relevant information.

    Args:
        data (dict): Raw API response

    Returns:
        dict: Processed medication data
    """
    processed = {
        "medications": [],
        "warnings": [],
        "side_effects": []
    }

    if "results" not in data:
        return processed

    for result in data["results"]:
        # Extract medication name
        if "openfda" in result and "brand_name" in result["openfda"] and len(result["openfda"]["brand_name"]) > 0:
            medication = {
                "name": result["openfda"]["brand_name"][0],
                "generic_name": result["openfda"].get("generic_name", ["Unknown"])[0],
                "manufacturer": result["openfda"].get("manufacturer_name", ["Unknown"])[0],
                "indications": result.get("indications_and_usage", ["No indication information available"])[0]
            }
            processed["medications"].append(medication)

        # Extract warnings
        if "warnings" in result:
            processed["warnings"].extend(result["warnings"])

        # Extract side effects
        if "adverse_reactions" in result:
            processed["side_effects"].extend(result["adverse_reactions"])

    # Remove duplicates
    processed["warnings"] = list(set(processed["warnings"]))
    processed["side_effects"] = list(set(processed["side_effects"]))

    return processed

def get_gemini_health_insights(symptoms, condition):
    """
    Get health insights from Gemini API.

    Args:
        symptoms (list): List of symptoms
        condition (str): Diagnosed condition

    Returns:
        dict: Health insights from Gemini API
    """
    try:
        # Import the function from gemini_api module
        from gemini_api import generate_health_insights

        # Format the symptoms and condition for the prompt
        symptoms_text = ", ".join(symptoms)
        prompt = f"Based on the symptoms: {symptoms_text}, the diagnosed condition is: {condition}. "
        prompt += "Please provide detailed information about this condition including description, precautions, recommended lifestyle changes, and potential treatments."

        # Call the Gemini API
        insights = generate_health_insights(prompt)

        # Process and structure the response
        if insights and isinstance(insights, str):
            # Simple parsing of the response to extract sections
            sections = {
                "description": "",
                "precautions": [],
                "lifestyle": [],
                "treatments": []
            }

            # Extract description (first paragraph)
            parts = insights.split('\n\n')
            if parts:
                sections["description"] = parts[0]

            # Look for sections in the response
            current_section = None
            for line in insights.split('\n'):
                line = line.strip()
                if not line:
                    continue

                # Check for section headers
                lower_line = line.lower()
                if "precaution" in lower_line or "prevent" in lower_line:
                    current_section = "precautions"
                    continue
                elif "lifestyle" in lower_line or "diet" in lower_line or "exercise" in lower_line:
                    current_section = "lifestyle"
                    continue
                elif "treatment" in lower_line or "medication" in lower_line or "therapy" in lower_line:
                    current_section = "treatments"
                    continue

                # Add content to the current section
                if current_section and current_section in sections:
                    if isinstance(sections[current_section], list):
                        # Check if line starts with a bullet point or number
                        if line.startswith('- ') or line.startswith('• ') or (line[0].isdigit() and line[1:3] in ('. ', ') ')):
                            sections[current_section].append(line)
                        elif sections[current_section]:  # Append to the last item if it exists
                            sections[current_section][-1] += " " + line
                        else:
                            sections[current_section].append(line)

            return sections
        else:
            return {"error": "Failed to get insights from Gemini API"}

    except Exception as e:
        print(f"Error getting Gemini health insights: {e}")
        return {"error": f"Error getting Gemini health insights: {e}"}

def get_combined_health_data(symptoms):
    """
    Get combined health data from multiple APIs.

    Args:
        symptoms (list): List of symptoms

    Returns:
        dict: Combined health data
    """
    # Normalize symptoms to ensure consistent format
    normalized_symptoms = []
    for symptom in symptoms:
        # Convert underscores to spaces and standardize format
        normalized = symptom.replace('_', ' ').lower().strip()
        if normalized and normalized not in normalized_symptoms:
            normalized_symptoms.append(normalized)

    # Get diagnosis data
    diagnosis_data = get_diagnosis(tuple(normalized_symptoms))

    # Extract the most likely condition
    condition = None
    issue_details = {}
    if "diagnosis" in diagnosis_data and diagnosis_data["diagnosis"]:
        for diagnosis in diagnosis_data["diagnosis"]:
            if "condition" in diagnosis and diagnosis["condition"]:
                condition = diagnosis["condition"]
                issue_details = diagnosis
                break

    # Get medication data if we have a condition
    medication_data = {}
    if condition:
        medication_data = get_medications(condition)

    # Get Gemini health insights if we have a condition
    gemini_insights = {}
    if condition:
        gemini_insights = get_gemini_health_insights(normalized_symptoms, condition)

    # Combine the data
    combined_data = {
        "symptoms": normalized_symptoms,
        "diagnosis": diagnosis_data.get("diagnosis", []),
        "condition": condition,
        "issue_details": issue_details,
        "medications": medication_data.get("medications", []),
        "warnings": medication_data.get("warnings", []),
        "side_effects": medication_data.get("side_effects", []),
        "insights": gemini_insights
    }

    # Add error information if present
    if "error" in diagnosis_data:
        combined_data["error"] = diagnosis_data["error"]

    return combined_data

def clear_cache():
    """Clear all cached API responses."""
    for filename in os.listdir(CACHE_DIR):
        if filename.endswith(".json"):
            os.remove(os.path.join(CACHE_DIR, filename))
    print("API cache cleared.")
