import datetime
from diffusers import StableDiffusionPipeline, EulerDiscreteScheduler

pipeline = StableDiffusionPipeline.from_single_file(
    "../../models/epic.safetensors"
)

pipeline.scheduler = EulerDiscreteScheduler.from_config(pipeline.scheduler.config)

pipeline = pipeline.to("cuda")
prompt = """A wide-angle shot of the coffee shop, highlighting its raw cement walls and steel beams. Among this industrial design, wooden tables offer warmth. On a wall, a mural inspired by African themes introduces vibrancy.
Photo Details: Use a DSLR with a wide-angle lens to cover the breadth of the café, capturing the balance of rawness and warmth. Choose a time when sunlight filters through windows, casting interesting shadows.
"""

sampling_steps = 30
width = 768
height = 512
num_images_per_prompt = 8

images = pipeline(prompt, num_inference_steps=sampling_steps, width=width, height=height, num_images_per_prompt=num_images_per_prompt).images

timestamp = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")

for i, image in enumerate(images):
    filename = f"../../out/{timestamp}-{i}.png"
    image.save(filename)
    print(f"Saved {filename}")
