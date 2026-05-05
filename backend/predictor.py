from backend.model_loader import yolo_model, eff_model
from backend.utils import preprocess_image
import numpy as np
import cv2
import json
import os

disease_info = {}
info_path = os.path.join(os.path.dirname(__file__), "disease_info.json")
if os.path.exists(info_path):
    with open(info_path, "r") as f:
        disease_info = json.load(f)

# Update based on your EfficientNet classes
class_names = ['Tomato___Bacterial_spot',
 'Tomato___Early_blight',
 'Tomato___Late_blight',
 'Tomato___Leaf_Mold',
 'Tomato___Septoria_leaf_spot',
 'Tomato___Spider_mites Two-spotted_spider_mite',
 'Tomato___Target_Spot',
 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
 'Tomato___Tomato_mosaic_virus',
 'Tomato___healthy']


# -----------------------------
# EfficientNet → Classification
# -----------------------------
def classify(image_path):
    img_input, _ = preprocess_image(image_path)
    preds = eff_model.predict(img_input)
    class_id = np.argmax(preds)
    return class_names[class_id]

# -----------------------------


def calculate_severity(image_path):
    results = yolo_model.predict(image_path, conf=0.4)

    img = cv2.imread(image_path)

    # =========================
    # STEP 1: LEAF AREA (FIX)
    # =========================
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Mask for leaf (green + some yellow/brown)
    lower = np.array([20, 30, 30])
    upper = np.array([100, 255, 255])

    mask = cv2.inRange(hsv, lower, upper)

    leaf_area = cv2.countNonZero(mask)

    # fallback (in case mask fails)
    if leaf_area < 500:
        leaf_area = img.shape[0] * img.shape[1]

    # =========================
    # STEP 2: YOLO DETECTION
    # =========================
    boxes = results[0].boxes

    infected_area = 0
    spot_count = 0

    if boxes is not None and len(boxes) > 0:
        for box in boxes:
            conf = float(box.conf)

            # filter weak detections
            if conf > 0.4:
                x1, y1, x2, y2 = box.xyxy[0]

                box_area = float((x2 - x1) * (y2 - y1))
                infected_area += box_area
                spot_count += 1

    # avoid overflow
    infected_area = min(infected_area, leaf_area)

    # =========================
    # STEP 3: SEVERITY
    # =========================
    severity = (infected_area / leaf_area) * 100

    # =========================
    # STEP 4: LEVEL
    # =========================
    if severity < 10:
        level = "Mild"
    elif severity < 35:
        level = "Moderate"
    else:
        level = "Severe"

    return round(severity, 2), level, spot_count

# -----------------------------
# FINAL PIPELINE
# -----------------------------
def predict(image_path):
    disease = classify(image_path)
    severity, level, spots = calculate_severity(image_path)

    info = disease_info.get(disease, {})
    causes = info.get("causes", "")
    remedies = info.get("remedies", "")

    return {
        "disease": disease,
        "severity": severity,
        "level": level,
        "spots": spots,
        "causes": causes,
        "remedies": remedies
    }