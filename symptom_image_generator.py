import requests
import os
import json
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import random
import math
import time
import hashlib
from functools import lru_cache

# Dictionary mapping symptoms to image URLs or descriptions for image generation
# This will be used when we don't have actual images for symptoms
SYMPTOM_IMAGES = {
    # Respiratory symptoms
    "continuous_sneezing": "Person sneezing with tissue, showing droplets in the air",
    "cough": "Person coughing into elbow, showing proper respiratory etiquette",
    "breathlessness": "Person with hand on chest showing difficulty breathing, with blue-tinged lips",
    "phlegm": "Microscopic view of yellow-green mucus with white blood cells",
    "throat_irritation": "Close-up of inflamed throat with redness and swelling",
    "runny_nose": "Person with nasal discharge and tissue",
    "congestion": "Cross-section of congested nasal passages with inflamed tissue",
    "sinus_pressure": "Anatomical illustration of inflamed sinuses with pressure points",
    "chest_pain": "Anatomical illustration of chest with pain radiating from heart or lungs",
    "mucoid_sputum": "Microscopic view of mucus-containing sputum with cellular debris",
    "rusty_sputum": "Sputum sample with rust-colored blood indicating pneumonia",
    "blood_in_sputum": "Sputum sample with bright red blood streaks",

    # Skin symptoms
    "itching": "Close-up of skin with visible irritation and scratch marks",
    "skin_rash": "Close-up of skin with red, raised, irregular rash pattern",
    "nodal_skin_eruptions": "Skin with raised, fluid-filled nodules and surrounding inflammation",
    "dischromic_patches": "Skin showing patches of discoloration with irregular borders",
    "yellowish_skin": "Face with yellowed skin tone indicating jaundice",
    "pus_filled_pimples": "Close-up of skin with white-topped pustules and inflammation",
    "blackheads": "Microscopic view of pores with oxidized sebum plugs",
    "scurring": "Skin with visible scarring and texture changes",
    "skin_peeling": "Close-up of skin with visible peeling and flaking",
    "silver_like_dusting": "Skin with silvery-white scales characteristic of psoriasis",
    "small_dents_in_nails": "Close-up of fingernail with visible pitting",
    "inflammatory_nails": "Swollen, red nail fold with visible inflammation",
    "blister": "Close-up of skin with fluid-filled blister",
    "red_sore_around_nose": "Close-up of nose with red, inflamed sores",
    "yellow_crust_ooze": "Skin with honey-colored crusting indicating infection",
    "red_spots_over_body": "Body diagram showing distribution of red spots",

    # Pain symptoms
    "headache": "Head diagram showing different types of headache pain patterns",
    "back_pain": "Spine diagram highlighting areas of common back pain",
    "joint_pain": "Anatomical illustration of joint with inflammation and pain signals",
    "stomach_pain": "Abdomen diagram showing different regions of stomach pain",
    "abdominal_pain": "Cross-section of abdomen showing organs and pain locations",
    "belly_pain": "Person holding lower abdomen in pain with visible discomfort",
    "neck_pain": "Cervical spine diagram showing nerve compression and pain",
    "knee_pain": "Anatomical illustration of knee joint with inflammation",
    "hip_joint_pain": "Cross-section of hip joint showing cartilage damage",
    "muscle_pain": "Muscle fiber diagram showing inflammation and pain signals",
    "pain_behind_the_eyes": "Cross-section of eye showing optic nerve and surrounding structures",
    "pain_during_bowel_movements": "Anatomical illustration of rectum with inflammation",
    "pain_in_anal_region": "Diagram of anal region showing hemorrhoids and fissures",

    # Digestive symptoms
    "vomiting": "Person leaning forward with visible emesis",
    "nausea": "Person with hand over mouth and visible discomfort",
    "indigestion": "Diagram of stomach with acid reflux and inflammation",
    "constipation": "Diagram of colon showing impacted stool",
    "diarrhoea": "Diagram of intestines with increased motility and watery content",
    "acidity": "Cross-section of esophagus showing acid reflux",
    "ulcers_on_tongue": "Close-up of tongue with visible ulcerative lesions",
    "loss_of_appetite": "Diagram showing decreased hunger signals from hypothalamus",
    "increased_appetite": "Brain diagram showing heightened hunger signals",
    "passage_of_gases": "Diagram of intestines showing gas accumulation",
    "internal_itching": "Cross-section of intestine with irritation of nerve endings",
    "bloody_stool": "Stool sample with visible blood indicating GI bleeding",
    "irritation_in_anus": "Close-up of anal tissue with inflammation and irritation",
    "stomach_bleeding": "Diagram of stomach with ulceration and bleeding sites",
    "distention_of_abdomen": "Profile view of distended abdomen with gas accumulation",

    # Neurological symptoms
    "dizziness": "Brain diagram showing vestibular system dysfunction",
    "loss_of_balance": "Person demonstrating unsteady gait with directional sway",
    "unsteadiness": "Person using wall for support while walking",
    "spinning_movements": "Illustration of inner ear showing vertigo mechanism",
    "weakness_of_one_body_side": "Body diagram showing hemiparesis pattern",
    "loss_of_smell": "Nasal passage diagram showing olfactory nerve damage",
    "altered_sensorium": "Brain diagram showing areas affecting consciousness",
    "lack_of_concentration": "Brain activity diagram showing reduced prefrontal activity",
    "visual_disturbances": "Eye diagram showing common visual disturbance patterns",
    "slurred_speech": "Brain diagram highlighting speech centers with dysfunction",
    "coma": "Brain scan showing reduced activity consistent with comatose state",

    # General symptoms
    "high_fever": "Thermometer showing temperature above 102°F/39°C",
    "mild_fever": "Thermometer showing slight elevation in temperature",
    "fatigue": "Cellular diagram showing depleted ATP and energy stores",
    "weight_gain": "Body composition diagram showing increased adipose tissue",
    "weight_loss": "Body composition diagram showing decreased muscle and fat mass",
    "sweating": "Microscopic view of active sweat gland with secretion",
    "chills": "Thermal imaging of body showing temperature regulation attempts",
    "shivering": "Muscle diagram showing involuntary contractions for heat",
    "dehydration": "Cellular diagram showing fluid loss and electrolyte imbalance",
    "sunken_eyes": "Profile view of face showing orbital hollowing from fluid loss",
    "lethargy": "Brain activity diagram showing reduced metabolic activity",
    "restlessness": "Brain diagram showing heightened activity in limbic system",
    "anxiety": "Brain scan showing hyperactivity in amygdala and related structures",
    "mood_swings": "Graph showing emotional fluctuations over time",
    "depression": "Brain chemistry diagram showing neurotransmitter imbalance",
    "irritability": "Brain diagram showing lowered threshold for stress response",

    # Cardiovascular symptoms
    "fast_heart_rate": "ECG showing tachycardia with rapid QRS complexes",
    "palpitations": "Heart diagram showing irregular contractions",
    "swollen_blood_vessels": "Cross-section of blood vessel with inflammation",
    "prominent_veins_on_calf": "Leg showing visible, enlarged veins",
    "swollen_extremeties": "Comparison of normal vs. edematous limb",
    "swollen_legs": "Legs with visible pitting edema on pressure",
    "cold_hands_and_feets": "Thermal imaging showing reduced circulation to extremities",

    # Urinary symptoms
    "dark_urine": "Urine sample showing abnormally dark color with scale",
    "yellow_urine": "Urine sample showing yellow color indicating concentration",
    "foul_smell_of urine": "Urine sample with visual indicators of odor",
    "continuous_feel_of_urine": "Bladder diagram showing irritation of sensory nerves",
    "polyuria": "Diagram showing increased urine production and frequency",
    "bladder_discomfort": "Anatomical illustration of inflamed bladder",
    "spotting_urination": "Diagram showing urinary tract with irregular flow",
    "burning_micturition": "Urinary tract diagram showing inflammation during urination",

    # Metabolic symptoms
    "irregular_sugar_level": "Graph showing blood glucose fluctuations outside normal range",
    "excessive_hunger": "Diagram showing disrupted satiety signals",
    "obesity": "Body mass index chart showing classification of obesity",
    "puffy_face_and_eyes": "Face showing characteristic cushingoid appearance",
    "enlarged_thyroid": "Neck diagram showing thyroid enlargement",
    "brittle_nails": "Close-up of fingernails showing brittleness and splitting",
    "fluid_overload": "Body diagram showing edema distribution in fluid overload",
    "swelling_of_stomach": "Abdominal cross-section showing ascites",
    "yellowing_of_eyes": "Close-up of eye showing yellowed sclera in jaundice",
    "acute_liver_failure": "Liver diagram showing necrosis and dysfunction",
    "family_history": "Family tree diagram showing inheritance patterns",
    "history_of_alcohol_consumption": "Liver diagram showing progressive alcoholic damage",
    "receiving_blood_transfusion": "Medical illustration of blood transfusion procedure",
    "receiving_unsterile_injections": "Microscopic view of contaminated needle with pathogens",
    "toxic_look_(typhos)": "Person with characteristic typhoid fever appearance",
    "malaise": "Person showing general unwellness and discomfort",
    "muscle_wasting": "Comparison of normal vs. atrophied muscle tissue",
    "swelled_lymph_nodes": "Diagram of lymphatic system with enlarged nodes",
    "extra_marital_contacts": "Educational diagram about STI transmission risk",
    "drying_and_tingling_lips": "Close-up of lips showing dryness and cracking",
    "abnormal_menstruation": "Diagram showing abnormal menstrual patterns",
    "watering_from_eyes": "Close-up of eye with excessive tearing",
    "movement_stiffness": "Joint diagram showing restricted range of motion",
    "stiff_neck": "Cervical spine diagram showing muscle spasm and limited motion"
}

# Cache for storing generated images to avoid redundant API calls
IMAGE_CACHE = {}  # Clear the cache to ensure the new cough image is used

# Cache expiration time in seconds (24 hours)
CACHE_EXPIRATION = 86400

@lru_cache(maxsize=100)
def generate_symptom_image(symptom, size=(300, 300)):
    """
    Generate a realistic medical illustration for a given symptom using Gemini API.

    Args:
        symptom (str): The symptom to generate an image for
        size (tuple): The size of the image to generate (width, height)

    Returns:
        str: Base64 encoded image data
    """
    # Normalize the symptom name
    symptom = symptom.lower().strip()

    # Try to use a custom image from the static/images directory
    try:
        # Map symptom names to image filenames (handling spaces and formatting)
        # This mapping handles variations in symptom names and image filenames
        filename_mapping = {
            "cough": "cough.jpg",
            "breathlessness": "breathlessness.jpg",
            "fatigue": "fatigue.jpg",
            "headache": "headache.jpg",
            "high_fever": "high fever.jpg",
            "joint_pain": "joint pain.jpg",
            "nausea": "nausea.jpg",
            "skin_rash": "skin rash.jpg",
            "blackheads": "black heads.jpg",
            "bladder_discomfort": "bladder discomfort.jpg",
            "blister": "blister.jpg",
            "blood_in_sputum": "blood in sputum.jpg",
            "bloody_stool": "bloody stool.jpg",
            "blurred_vision": "blurred and distorted vision.jpg",
            "brittle_nails": "brittle nails.jpg",
            "chills": "chills.jpg"
        }

        # Get the filename for this symptom
        image_filename = filename_mapping.get(symptom)

        # If no direct mapping, try to find a matching filename
        if not image_filename:
            # Convert underscores to spaces for matching
            symptom_with_spaces = symptom.replace('_', ' ')

            # Check if there's an image file that matches the symptom name
            for filename in os.listdir(os.path.join("static", "images")):
                if filename.lower().endswith('.jpg') or filename.lower().endswith('.png'):
                    # Remove extension and convert to lowercase for comparison
                    name_without_ext = os.path.splitext(filename)[0].lower()
                    if symptom_with_spaces == name_without_ext or symptom == name_without_ext:
                        image_filename = filename
                        break

        # If we found a matching image file, use it
        if image_filename:
            custom_image_path = os.path.join("static", "images", image_filename)

            # Check if the file exists
            if os.path.exists(custom_image_path):
                # Open and resize the image
                with Image.open(custom_image_path) as img:
                    # Handle different versions of PIL/Pillow
                    try:
                        # For newer versions of Pillow
                        if hasattr(Image, 'Resampling'):
                            img = img.resize(size, Image.Resampling.LANCZOS)
                        # For older versions of Pillow
                        else:
                            img = img.resize(size, Image.LANCZOS)
                    except AttributeError:
                        # Fallback to BICUBIC if LANCZOS is not available
                        img = img.resize(size)

                    # Convert the image to base64
                    buffered = io.BytesIO()
                    img.save(buffered, format="JPEG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()

                    # Return the base64 encoded image
                    return f"data:image/jpeg;base64,{img_str}"
            else:
                print(f"Custom image not found at {custom_image_path}")
    except Exception as e:
        print(f"Error loading custom image for {symptom}: {e}")
        # Fall back to normal generation if there's an error

    # Check if we have a cached image that's not expired
    cache_key = f"{symptom}_{size[0]}x{size[1]}"
    if cache_key in IMAGE_CACHE:
        cached_data = IMAGE_CACHE[cache_key]
        if time.time() - cached_data['timestamp'] < CACHE_EXPIRATION:
            return cached_data['image']

    # Get the description for the symptom
    description = SYMPTOM_IMAGES.get(symptom, f"Medical illustration of {symptom}")

    # Try to generate an image using Gemini API
    try:
        image_data = generate_image_with_gemini(symptom, description)
        if image_data:
            # Cache the generated image
            IMAGE_CACHE[cache_key] = {
                'image': image_data,
                'timestamp': time.time()
            }
            return image_data
    except Exception as e:
        print(f"Error generating image with Gemini API: {e}")
        # Fall back to local generation if API fails

    # If Gemini API fails or is not available, generate a local image
    return generate_local_image(symptom, description, size)

def generate_image_with_gemini(symptom, description):
    """
    Generate an image using the Gemini API.

    Args:
        symptom (str): The symptom name
        description (str): The description of the symptom

    Returns:
        str: Base64 encoded image data or None if generation fails
    """
    API_KEY = "AIzaSyBDqsAreOY179gQsTF-qJBfLC9osvcTnT0"
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"

    # Create a detailed prompt for the image generation
    prompt = f"""Create a realistic medical illustration of the symptom: {symptom}.

    Description: {description}

    The image should be:
    - Medically accurate and educational
    - Clear and focused on the symptom
    - Suitable for a healthcare application
    - Professional in appearance
    - Appropriate for general audience (not graphic or disturbing)

    Please generate a detailed, anatomically correct illustration that would be helpful for patients to identify this symptom."""

    try:
        # Make the API request
        response = requests.post(
            f"{API_URL}?key={API_KEY}",
            json={
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.4,
                    "topK": 32,
                    "topP": 0.95,
                    "maxOutputTokens": 2048,
                }
            },
            timeout=10
        )

        # Check if the request was successful
        if response.status_code == 200:
            result = response.json()

            # Extract the image data if available
            if 'candidates' in result and len(result['candidates']) > 0:
                candidate = result['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    for part in candidate['content']['parts']:
                        if 'inlineData' in part and 'data' in part['inlineData']:
                            # Return the base64 encoded image data
                            return f"data:image/png;base64,{part['inlineData']['data']}"

        # If we reach here, the API didn't return an image
        return None

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def generate_local_image(symptom, description, size=(300, 300)):
    """
    Generate a local image for a symptom when API generation fails.

    Args:
        symptom (str): The symptom to generate an image for
        description (str): The description of the symptom
        size (tuple): The size of the image to generate (width, height)

    Returns:
        str: Base64 encoded image data
    """
    # Create a blank image with white background
    img = Image.new('RGB', size, color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Try to load a font, use default if not available
    try:
        font = ImageFont.truetype("Arial.ttf", 20)
    except IOError:
        font = ImageFont.load_default()

    # Create a hash of the symptom name for consistent colors
    symptom_hash = hashlib.md5(symptom.encode()).hexdigest()

    # Use the hash to generate a color (medical-themed, soft colors)
    hue = int(symptom_hash[:2], 16) / 255.0  # Convert first 2 hex digits to 0-1 range

    # Convert HSV to RGB (using simplified conversion)
    # Using medical-themed colors (blues, greens, soft purples)
    if "pain" in symptom:
        # Reddish for pain
        r, g, b = 230, 120, 120
    elif "fever" in symptom or "temperature" in symptom:
        # Orange-red for fever
        r, g, b = 240, 150, 100
    elif "skin" in symptom or "rash" in symptom:
        # Pink for skin conditions
        r, g, b = 240, 180, 180
    elif "respiratory" in symptom or "breath" in symptom or "cough" in symptom:
        # Blue for respiratory
        r, g, b = 150, 200, 230
    elif "digestive" in symptom or "stomach" in symptom or "nausea" in symptom:
        # Green for digestive
        r, g, b = 150, 220, 170
    elif "neuro" in symptom or "head" in symptom or "dizz" in symptom:
        # Purple for neurological
        r, g, b = 180, 150, 220
    else:
        # Default medical blue
        r, g, b = 120, 180, 220

    # Create a gradient background
    for y in range(size[1]):
        # Calculate gradient color
        ratio = y / size[1]
        gradient_r = int(r - (r * 0.3 * ratio))
        gradient_g = int(g - (g * 0.3 * ratio))
        gradient_b = int(b - (b * 0.3 * ratio))

        # Draw a line with the gradient color
        draw.line([(0, y), (size[0], y)], fill=(gradient_r, gradient_g, gradient_b))

    # Draw a border
    border_width = 5
    draw.rectangle(
        [(border_width, border_width),
         (size[0] - border_width, size[1] - border_width)],
        outline=(255, 255, 255),
        width=border_width
    )

    # Draw the symptom name
    text_position = (size[0] // 2, 30)
    draw.text(
        text_position,
        symptom.replace('_', ' ').title(),
        fill=(255, 255, 255),
        font=font,
        anchor="mm"
    )

    # Draw a medical symbol based on the symptom category
    symbol_position = (size[0] // 2, size[1] // 2)

    if "pain" in symptom:
        # Draw a pain symbol (lightning bolt)
        points = [
            (symbol_position[0] - 30, symbol_position[1] + 30),
            (symbol_position[0], symbol_position[1] - 30),
            (symbol_position[0] + 15, symbol_position[1]),
            (symbol_position[0] - 15, symbol_position[1] + 60)
        ]
        draw.polygon(points, fill=(255, 255, 200))

    elif "fever" in symptom or "temperature" in symptom:
        # Draw a thermometer
        draw.rectangle(
            [(symbol_position[0] - 5, symbol_position[1] - 40),
             (symbol_position[0] + 5, symbol_position[1] + 20)],
            fill=(255, 100, 100)
        )
        draw.ellipse(
            [(symbol_position[0] - 15, symbol_position[1] + 15),
             (symbol_position[0] + 15, symbol_position[1] + 45)],
            fill=(255, 100, 100)
        )
        # Mercury line
        draw.rectangle(
            [(symbol_position[0] - 2, symbol_position[1] - 30),
             (symbol_position[0] + 2, symbol_position[1] + 20)],
            fill=(255, 255, 255)
        )

    elif "skin" in symptom or "rash" in symptom:
        # Draw skin with rash pattern
        skin_rect = [
            (symbol_position[0] - 50, symbol_position[1] - 40),
            (symbol_position[0] + 50, symbol_position[1] + 40)
        ]
        draw.rectangle(skin_rect, fill=(255, 220, 200))

        # Draw rash spots with different sizes
        for _ in range(20):
            x = random.randint(skin_rect[0][0] + 5, skin_rect[1][0] - 5)
            y = random.randint(skin_rect[0][1] + 5, skin_rect[1][1] - 5)
            spot_size = random.randint(2, 6)
            draw.ellipse(
                [(x - spot_size, y - spot_size), (x + spot_size, y + spot_size)],
                fill=(255, 100, 100)
            )

    elif "respiratory" in symptom or "breath" in symptom or "cough" in symptom:
        # Draw lungs
        # Left lung
        draw.ellipse(
            [(symbol_position[0] - 50, symbol_position[1] - 30),
             (symbol_position[0] - 10, symbol_position[1] + 30)],
            outline=(100, 150, 230),
            width=3
        )
        # Right lung
        draw.ellipse(
            [(symbol_position[0] + 10, symbol_position[1] - 30),
             (symbol_position[0] + 50, symbol_position[1] + 30)],
            outline=(100, 150, 230),
            width=3
        )
        # Trachea
        draw.rectangle(
            [(symbol_position[0] - 5, symbol_position[1] - 50),
             (symbol_position[0] + 5, symbol_position[1] - 30)],
            outline=(100, 150, 230),
            width=3
        )

    elif "digestive" in symptom or "stomach" in symptom or "nausea" in symptom:
        # Draw stomach and intestines
        # Stomach
        draw.ellipse(
            [(symbol_position[0] - 30, symbol_position[1] - 20),
             (symbol_position[0] + 30, symbol_position[1] + 20)],
            outline=(100, 200, 150),
            width=3
        )
        # Intestine curves
        for i in range(3):
            y_offset = 25 + i * 15
            draw.arc(
                [(symbol_position[0] - 40, symbol_position[1] + y_offset - 10),
                 (symbol_position[0] + 40, symbol_position[1] + y_offset + 10)],
                180 if i % 2 == 0 else 0,
                360 if i % 2 == 0 else 180,
                fill=(100, 200, 150),
                width=3
            )

    elif "neuro" in symptom or "head" in symptom or "dizz" in symptom:
        # Draw brain
        # Brain outline
        draw.ellipse(
            [(symbol_position[0] - 40, symbol_position[1] - 30),
             (symbol_position[0] + 40, symbol_position[1] + 30)],
            outline=(180, 150, 220),
            width=3
        )
        # Brain folds
        for i in range(5):
            y_pos = symbol_position[1] - 25 + i * 10
            amplitude = 5
            for x in range(symbol_position[0] - 35, symbol_position[0] + 36, 2):
                y = y_pos + amplitude * math.sin((x - symbol_position[0]) / 5)
                draw.point((x, y), fill=(180, 150, 220))

    else:
        # Default medical symbol (caduceus)
        # Staff
        draw.line(
            [(symbol_position[0], symbol_position[1] - 40),
             (symbol_position[0], symbol_position[1] + 40)],
            fill=(100, 150, 200),
            width=3
        )

        # Snakes
        for direction in [-1, 1]:
            for i in range(4):
                y = symbol_position[1] - 30 + i * 20
                x1 = symbol_position[0]
                x2 = symbol_position[0] + direction * 15

                if i % 2 == 0:
                    draw.arc(
                        [(min(x1, x2) - 10, y - 10), (max(x1, x2) + 10, y + 10)],
                        0 if direction > 0 else 180,
                        180 if direction > 0 else 0,
                        fill=(100, 150, 200),
                        width=2
                    )
                else:
                    draw.arc(
                        [(min(x1, x2) - 10, y - 10), (max(x1, x2) + 10, y + 10)],
                        180 if direction > 0 else 0,
                        0 if direction > 0 else 180,
                        fill=(100, 150, 200),
                        width=2
                    )

    # Draw a short description
    desc_text = description[:50] + "..." if len(description) > 50 else description
    desc_position = (size[0] // 2, size[1] - 30)
    draw.text(
        desc_position,
        desc_text,
        fill=(255, 255, 255),
        font=font,
        anchor="mm"
    )

    # Convert the image to base64 for embedding in HTML
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return f"data:image/png;base64,{img_str}"

# Dictionary of comprehensive symptom descriptions
SYMPTOM_DESCRIPTIONS = {
    # Respiratory symptoms
    "continuous_sneezing": "Repeated, forceful expulsion of air through the nose and mouth, often due to irritation of nasal mucosa. May indicate allergies, infections, or irritants.",
    "cough": "Sudden expulsion of air from the lungs to clear airways. Can be dry or productive, acute or chronic. Common in respiratory infections, allergies, or lung conditions.",
    "breathlessness": "Difficulty breathing or shortness of breath. May occur during activity or at rest. Can indicate respiratory, cardiac, or anxiety-related conditions.",
    "phlegm": "Thick mucus secreted by the respiratory tract. Color and consistency can indicate different conditions - clear (allergies), yellow/green (infection), blood-tinged (inflammation/damage).",
    "throat_irritation": "Discomfort, pain, or scratchiness in the throat. May be accompanied by difficulty swallowing. Common in infections, allergies, or from environmental irritants.",

    # Skin symptoms
    "itching": "Irritating sensation that causes a desire to scratch. May be localized or generalized. Can indicate allergic reactions, skin conditions, or systemic diseases.",
    "skin_rash": "Area of irritated or swollen skin that may change color, texture, or appearance. Patterns and distribution help identify specific conditions.",
    "nodal_skin_eruptions": "Raised, solid lesions in the skin that may be inflammatory or neoplastic. Size, distribution, and characteristics help determine cause.",
    "dischromic_patches": "Areas of skin with abnormal pigmentation (lighter or darker). May indicate inflammatory conditions, infections, or autoimmune disorders.",

    # Pain symptoms
    "headache": "Pain in any region of the head. Types include tension, migraine, cluster, and sinus headaches. May indicate stress, dehydration, or underlying conditions.",
    "back_pain": "Discomfort in the upper, middle, or lower back. Can be acute or chronic, dull or sharp. May result from muscle strain, disc issues, or systemic conditions.",
    "joint_pain": "Discomfort, aches, or soreness in joints. May be accompanied by swelling, redness, or limited mobility. Common in arthritis, injuries, or infections.",
    "stomach_pain": "Discomfort in the abdominal region. Location, character, and timing help identify causes such as gastritis, ulcers, or inflammatory conditions.",

    # Digestive symptoms
    "vomiting": "Forceful expulsion of stomach contents through the mouth. May be preceded by nausea. Can indicate infections, food poisoning, or digestive disorders.",
    "nausea": "Unpleasant sensation of needing to vomit. May occur alone or with vomiting. Common in digestive disorders, infections, or as medication side effects.",
    "indigestion": "Discomfort in the upper abdomen, often after eating. May include bloating, heartburn, or nausea. Can indicate various digestive disorders.",
    "diarrhoea": "Loose, watery stools occurring more frequently than normal. May be acute or chronic. Can indicate infections, food intolerances, or inflammatory bowel conditions.",

    # Neurological symptoms
    "dizziness": "Sensation of lightheadedness, unsteadiness, or spinning (vertigo). May indicate inner ear problems, low blood pressure, or neurological conditions.",
    "loss_of_balance": "Difficulty maintaining equilibrium when standing or walking. May result from inner ear disorders, neurological conditions, or medication effects.",
    "fatigue": "Persistent tiredness or exhaustion not relieved by rest. May be physical or mental. Can indicate various conditions including anemia, infections, or chronic diseases.",

    # General symptoms
    "high_fever": "Body temperature significantly above normal (typically >101°F/38.3°C). Indicates the body's response to infection, inflammation, or other conditions.",
    "mild_fever": "Slight elevation in body temperature (typically 99-101°F/37.2-38.3°C). May indicate minor infections or inflammatory processes.",
    "chills": "Sensation of cold with shivering despite normal or elevated body temperature. Often accompanies fever in infections.",
    "dehydration": "Excessive loss of body fluids. Signs include thirst, dry mouth, dark urine, and fatigue. Can result from inadequate intake or excessive loss through illness.",

    # Cardiovascular symptoms
    "fast_heart_rate": "Heart rate above normal resting rate (typically >100 beats per minute). May indicate stress, exercise, fever, or cardiac conditions.",
    "chest_pain": "Discomfort or pain in the chest area. Character, location, and associated symptoms help determine if cardiac, respiratory, musculoskeletal, or digestive in origin.",

    # Metabolic symptoms
    "weight_loss": "Unintentional decrease in body weight. May indicate various conditions including infections, cancer, digestive disorders, or metabolic diseases.",
    "weight_gain": "Unintentional increase in body weight. May indicate hormonal changes, fluid retention, medication effects, or metabolic disorders.",
    "irregular_sugar_level": "Blood glucose levels outside normal range. May cause symptoms like thirst, frequent urination, fatigue. Indicates diabetes or other metabolic disorders."
}

def get_symptom_images(symptoms, count=8):
    """
    Get images and comprehensive descriptions for a list of symptoms.

    Args:
        symptoms (list): List of symptoms to get images for
        count (int): Maximum number of images to return

    Returns:
        list: List of dictionaries with symptom name, image data, and description
    """
    result = []

    # If no symptoms provided, return some common symptoms
    if not symptoms:
        # Prioritize symptoms that have custom images in the static/images directory
        available_images = []
        try:
            # Get all image files from the static/images directory
            image_files = [f for f in os.listdir(os.path.join("static", "images"))
                          if f.lower().endswith('.jpg') or f.lower().endswith('.png')]

            # Extract symptom names from the image filenames
            for img_file in image_files:
                name_without_ext = os.path.splitext(img_file)[0].lower()
                # Convert spaces to underscores for consistency with symptom names
                symptom_name = name_without_ext.replace(' ', '_')
                available_images.append(symptom_name)
        except Exception as e:
            print(f"Error getting available images: {e}")

        # If we have available images, use them
        if available_images:
            # Create a mapping of symptom names to their normalized form
            # This helps prevent duplicates like "skin_rash" and "skin rash"
            normalized_symptoms = {}
            for symptom in available_images:
                # Normalize by removing underscores and converting to lowercase
                normalized = symptom.replace('_', ' ').lower()
                if normalized not in normalized_symptoms:
                    normalized_symptoms[normalized] = symptom

            # Get unique symptoms after normalization
            unique_symptoms = list(normalized_symptoms.values())

            # Categorize available symptoms
            respiratory = [s for s in unique_symptoms if any(term in s.lower() for term in ["cough", "breath", "sneez"])]
            skin = [s for s in unique_symptoms if any(term in s.lower() for term in ["skin", "rash", "blister"])]
            pain = [s for s in unique_symptoms if any(term in s.lower() for term in ["pain", "ache", "headache"])]
            digestive = [s for s in unique_symptoms if any(term in s.lower() for term in ["nausea", "vomit", "stool"])]
            general = [s for s in unique_symptoms if any(term in s.lower() for term in ["fever", "fatigue", "chill"])]

            # Combine and select a diverse set, ensuring no duplicates
            common_symptoms = []

            # Helper function to add symptoms without duplicates
            def add_unique_symptoms(symptom_list, max_count):
                added = 0
                for s in symptom_list:
                    normalized = s.replace('_', ' ').lower()
                    # Check if a similar symptom is already in common_symptoms
                    if not any(existing.replace('_', ' ').lower() == normalized for existing in common_symptoms):
                        common_symptoms.append(s)
                        added += 1
                        if added >= max_count:
                            break

            # Add symptoms from each category
            add_unique_symptoms(respiratory, 1)
            add_unique_symptoms(skin, 1)
            add_unique_symptoms(pain, 2)
            add_unique_symptoms(digestive, 1)
            add_unique_symptoms(general, 2)

            # If we still need more, add other available images
            other_images = [s for s in unique_symptoms if s not in common_symptoms]
            add_unique_symptoms(other_images, count - len(common_symptoms))

            # Limit to requested count
            common_symptoms = common_symptoms[:count]
        else:
            # Fall back to default categories if no images are available
            respiratory = ["cough", "breathlessness", "throat_irritation"]
            skin = ["skin_rash", "itching"]
            pain = ["headache", "joint_pain", "stomach_pain"]
            digestive = ["nausea", "vomiting", "diarrhoea"]
            general = ["high_fever", "fatigue", "chills"]

            # Combine and select a diverse set
            common_symptoms = respiratory[:1] + skin[:1] + pain[:2] + digestive[:1] + general[:3]
            common_symptoms = common_symptoms[:count]

        for symptom in common_symptoms:
            # Get the comprehensive description if available
            description = SYMPTOM_DESCRIPTIONS.get(
                symptom,
                SYMPTOM_IMAGES.get(symptom, f"Medical illustration of {symptom}")
            )

            result.append({
                "symptom": symptom.replace('_', ' ').title(),
                "image": generate_symptom_image(symptom),
                "description": description
            })
        return result

    # Process provided symptoms
    for symptom in symptoms[:count]:
        # Get the comprehensive description if available
        description = SYMPTOM_DESCRIPTIONS.get(
            symptom,
            SYMPTOM_IMAGES.get(symptom, f"Medical illustration of {symptom}")
        )

        result.append({
            "symptom": symptom.replace('_', ' ').title(),
            "image": generate_symptom_image(symptom),
            "description": description
        })

    # If we need more images, add related symptoms based on categories
    if len(result) < count:
        # Identify categories of provided symptoms
        categories = set()
        for symptom in symptoms:
            if any(term in symptom for term in ["cough", "breath", "sneez", "throat", "phlegm"]):
                categories.add("respiratory")
            elif any(term in symptom for term in ["skin", "rash", "itch", "patch"]):
                categories.add("skin")
            elif any(term in symptom for term in ["pain", "ache", "sore"]):
                categories.add("pain")
            elif any(term in symptom for term in ["stomach", "nausea", "vomit", "diarr", "digest"]):
                categories.add("digestive")
            elif any(term in symptom for term in ["dizz", "balance", "vertigo"]):
                categories.add("neurological")
            elif any(term in symptom for term in ["fever", "chill", "temperature"]):
                categories.add("general")
            elif any(term in symptom for term in ["heart", "chest", "pulse"]):
                categories.add("cardiovascular")
            elif any(term in symptom for term in ["weight", "sugar", "metabol"]):
                categories.add("metabolic")

        # If no categories identified, add some common ones
        if not categories:
            categories = {"general", "respiratory", "pain"}

        # Get related symptoms from the identified categories
        additional_symptoms = []

        if "respiratory" in categories:
            additional_symptoms.extend(["cough", "breathlessness", "throat_irritation", "phlegm"])
        if "skin" in categories:
            additional_symptoms.extend(["skin_rash", "itching", "nodal_skin_eruptions"])
        if "pain" in categories:
            additional_symptoms.extend(["headache", "joint_pain", "back_pain", "stomach_pain"])
        if "digestive" in categories:
            additional_symptoms.extend(["nausea", "vomiting", "diarrhoea", "indigestion"])
        if "neurological" in categories:
            additional_symptoms.extend(["dizziness", "loss_of_balance", "fatigue"])
        if "general" in categories:
            additional_symptoms.extend(["high_fever", "mild_fever", "chills", "dehydration"])
        if "cardiovascular" in categories:
            additional_symptoms.extend(["fast_heart_rate", "chest_pain"])
        if "metabolic" in categories:
            additional_symptoms.extend(["weight_loss", "weight_gain", "irregular_sugar_level"])

        # Filter out symptoms already in the result
        existing_symptoms = [item["symptom"].lower().replace(' ', '_') for item in result]
        additional_symptoms = [s for s in additional_symptoms if s not in existing_symptoms]

        # Add additional symptoms up to the requested count
        for symptom in additional_symptoms[:count - len(result)]:
            # Get the comprehensive description if available
            description = SYMPTOM_DESCRIPTIONS.get(
                symptom,
                SYMPTOM_IMAGES.get(symptom, f"Medical illustration of {symptom}")
            )

            result.append({
                "symptom": symptom.replace('_', ' ').title(),
                "image": generate_symptom_image(symptom),
                "description": description
            })

    return result

def find_related_symptoms(input_symptom, all_symptoms, max_count=5):
    """
    Find symptoms related to the input symptom using semantic relationships and categories.

    Args:
        input_symptom (str): The input symptom
        all_symptoms (list): List of all available symptoms
        max_count (int): Maximum number of related symptoms to return

    Returns:
        list: List of related symptoms
    """
    input_symptom = input_symptom.lower().strip()
    related = []

    # Define symptom categories for better semantic matching
    categories = {
        "respiratory": ["cough", "breath", "sneez", "throat", "phlegm", "sinus", "congest", "runny", "sputum"],
        "skin": ["skin", "rash", "itch", "patch", "eruption", "blister", "pimple", "peeling", "yellow"],
        "pain": ["pain", "ache", "sore", "discomfort", "headache", "joint", "back", "stomach", "chest"],
        "digestive": ["stomach", "nausea", "vomit", "diarr", "digest", "bowel", "abdomen", "appetite"],
        "neurological": ["dizz", "balance", "vertigo", "head", "concentrat", "sensori", "speech", "smell"],
        "general": ["fever", "chill", "temperature", "fatigue", "tired", "sweat", "dehydrat", "lethargy"],
        "cardiovascular": ["heart", "chest", "pulse", "palpit", "vessel", "vein", "circulation"],
        "metabolic": ["weight", "sugar", "thyroid", "hunger", "obesity", "fluid"]
    }

    # Determine the category of the input symptom
    input_category = None
    for category, terms in categories.items():
        if any(term in input_symptom for term in terms):
            input_category = category
            break

    # First, find symptoms that contain the input as a substring (exact matches)
    for symptom in all_symptoms:
        if input_symptom in symptom.lower() and input_symptom != symptom.lower():
            related.append(symptom)
            if len(related) >= max_count:
                return related

    # Next, find symptoms in the same category
    if input_category and len(related) < max_count:
        category_terms = categories[input_category]
        for symptom in all_symptoms:
            if symptom.lower() not in [r.lower() for r in related] and symptom.lower() != input_symptom:
                if any(term in symptom.lower() for term in category_terms):
                    related.append(symptom)
                    if len(related) >= max_count:
                        break

    # If we need more, find symptoms that share words with the input
    if len(related) < max_count:
        input_words = set(input_symptom.replace('_', ' ').split())
        for symptom in all_symptoms:
            if symptom.lower() not in [r.lower() for r in related] and symptom.lower() != input_symptom:
                symptom_words = set(symptom.lower().replace('_', ' ').split())
                if input_words.intersection(symptom_words):
                    related.append(symptom)
                    if len(related) >= max_count:
                        break

    # If still need more, add semantically related symptoms based on medical knowledge
    if len(related) < max_count:
        # Define common symptom relationships
        symptom_relationships = {
            "headache": ["dizziness", "nausea", "fever", "pain_behind_the_eyes", "neck_pain"],
            "fever": ["chills", "sweating", "headache", "fatigue", "dehydration"],
            "cough": ["throat_irritation", "breathlessness", "phlegm", "chest_pain", "runny_nose"],
            "fatigue": ["weakness", "lethargy", "loss_of_appetite", "weight_loss", "depression"],
            "nausea": ["vomiting", "loss_of_appetite", "dizziness", "stomach_pain", "indigestion"],
            "dizziness": ["headache", "loss_of_balance", "nausea", "fatigue", "spinning_movements"],
            "pain": ["swelling", "redness", "stiffness", "tenderness", "limited_mobility"],
            "rash": ["itching", "skin_peeling", "redness", "swelling", "blister"],
            "swelling": ["pain", "redness", "warmth", "limited_mobility", "tenderness"]
        }

        # Check if input symptom has defined relationships
        for key, related_symptoms in symptom_relationships.items():
            if key in input_symptom:
                for rel_symptom in related_symptoms:
                    # Find the closest matching symptom in all_symptoms
                    for symptom in all_symptoms:
                        if rel_symptom in symptom.lower() and symptom.lower() not in [r.lower() for r in related] and symptom.lower() != input_symptom:
                            related.append(symptom)
                            if len(related) >= max_count:
                                break
                    if len(related) >= max_count:
                        break
            if len(related) >= max_count:
                break

    # If still need more, add common symptoms based on frequency in medical presentations
    if len(related) < max_count:
        common_symptoms = [
            "headache", "fever", "cough", "fatigue", "nausea",
            "dizziness", "back_pain", "skin_rash", "joint_pain",
            "breathlessness", "chest_pain", "abdominal_pain", "vomiting",
            "diarrhoea", "weight_loss", "loss_of_appetite", "sweating"
        ]

        for symptom in common_symptoms:
            for s in all_symptoms:
                if symptom in s.lower() and s.lower() not in [r.lower() for r in related] and s.lower() != input_symptom:
                    related.append(s)
                    if len(related) >= max_count:
                        break
            if len(related) >= max_count:
                break

    return related[:max_count]
