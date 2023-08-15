import datetime
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from diffusers.utils import load_image
import torch
import cv2
from PIL import Image
import numpy as np
from transformers import pipeline

image = load_image(
    "https://cdn.zappy.app/8e56b01e7f9b070120ab547d8353a2a4.jpg"
)

# function to create canny image
def canny_image(image):
    image = np.array(image)

    low_threshold = 100
    high_threshold = 200

    image = cv2.Canny(image, low_threshold, high_threshold)
    image = image[:, :, None]
    image = np.concatenate([image, image, image], axis=2)
    canny_image = Image.fromarray(image)
    return canny_image

def depth_image(image):
    depth_estimator = pipeline('depth-estimation')
    image = depth_estimator(image)['depth']
    image = np.array(image)
    image = image[:, :, None]
    image = np.concatenate([image, image, image], axis=2)
    control_image = Image.fromarray(image)
    return control_image

# control_image = canny_image(image)
control_image = depth_image(image)

controlnet = ControlNetModel.from_pretrained("lllyasviel/sd-controlnet-canny", torch_dtype=torch.float16)
pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "../../models/epic", controlnet=controlnet, torch_dtype=torch.float16
)

pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

pipe.enable_model_cpu_offload()

generator = torch.manual_seed(0)

prompt1 = """
A harmonious blend of tropical elements sets a relaxing tone in this office corner. Bamboo coffee table and vibrant cushions breathe life into the space." Captured with a Nikon D850, 35mm lens, f/1.8 aperture, 1/60s shutter speed, ISO 40
"""

prompt2 = """
Melding metal and brick, this office corner showcases an industrial chic ambiance. The iron coffee table and Edison bulb lighting accentuate the urban flair." Captured with a Canon EOS 5D Mark IV, 24mm lens, f/2.8 aperture, 1/50s shutter speed, ISO 320
"""

prompt3 = """
"Sleek lines and monochrome palette embody minimalist elegance in this office corner. The sculptural plants and muted accents create a refined aesthetic." Captured with a Sony A7R III, 50mm lens, f/1.4 aperture, 1/100s shutter speed, ISO 200.
"""

prompt4 = """
"Soft pastels and light wooden textures evoke a sense of Scandinavian coziness in this office corner. The fluffy rug and Nordic art pieces add warmth and style." Captured with a Fuji X-T3, 28mm lens, f/2.0 aperture, 1/40s shutter speed, ISO 250.
"""

prompt5 = """
"Embracing the charm of rustic farmhouse design, this office corner features weathered wood and antique decor. Distressed pots and vintage elements add to the nostalgic appeal." Captured with a Nikon D780, 35mm lens, f/2.2 aperture, 1/80s shutter speed, ISO 300.
"""

prompts = [prompt1, prompt2, prompt3, prompt4, prompt5]

for prompt in prompts:
    images = pipe(
        prompt, num_inference_steps=30, num_images_per_prompt=8, generator=generator, image=control_image
    ).images

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")

    for i, image in enumerate(images):
        filename = f"../../out/{timestamp}-{i}.png"
        image.save(filename)
        print(f"Saved {filename}")
