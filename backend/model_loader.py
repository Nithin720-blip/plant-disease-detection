from ultralytics import YOLO
import tensorflow as tf

# Load models once (important for performance)
yolo_model = YOLO("models/best2.pt")
eff_model = tf.keras.models.load_model("models\plant_disease_recog_model_pwp.keras")