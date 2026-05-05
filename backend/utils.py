import cv2
import numpy as np

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
        
    # Convert BGR (OpenCV default) to RGB (TensorFlow/Keras default)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize to 160x160 for EfficientNet
    img_resized = cv2.resize(img_rgb, (160, 160)) 
    
    # Do NOT divide by 255.0! EfficientNet has a built-in rescaling layer.
    return np.expand_dims(img_resized, axis=0), img