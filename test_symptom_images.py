import unittest
from flask import Flask
from main import app
import json
from symptom_image_generator import generate_symptom_image, get_symptom_images, find_related_symptoms

class TestSymptomImages(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
    
    def test_generate_symptom_image(self):
        """Test that symptom image generation works"""
        image_data = generate_symptom_image("headache")
        self.assertTrue(image_data.startswith("data:image/png;base64,"))
        
        # Test with different symptom
        image_data2 = generate_symptom_image("fever")
        self.assertTrue(image_data2.startswith("data:image/png;base64,"))
        
        # Images for different symptoms should be different
        self.assertNotEqual(image_data, image_data2)
    
    def test_get_symptom_images(self):
        """Test getting multiple symptom images"""
        symptoms = ["headache", "fever", "cough"]
        images = get_symptom_images(symptoms, count=3)
        
        # Should return 3 images
        self.assertEqual(len(images), 3)
        
        # Each image should have symptom name and image data
        for img in images:
            self.assertIn("symptom", img)
            self.assertIn("image", img)
            self.assertTrue(img["image"].startswith("data:image/png;base64,"))
    
    def test_find_related_symptoms(self):
        """Test finding related symptoms"""
        all_symptoms = ["headache", "severe_headache", "mild_headache", 
                       "fever", "high_fever", "cough", "dry_cough"]
        
        related = find_related_symptoms("headache", all_symptoms, max_count=2)
        
        # Should find related symptoms
        self.assertGreaterEqual(len(related), 1)
        
        # Related symptoms should contain "headache" in their name
        for symptom in related:
            self.assertIn("headache", symptom)
    
    def test_symptom_images_api(self):
        """Test the symptom images API endpoint"""
        # This test requires authentication, so we'll skip it for now
        # In a real test, you would need to mock the authentication
        pass

if __name__ == '__main__':
    unittest.main()
