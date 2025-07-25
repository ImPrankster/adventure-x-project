import os

from dotenv import load_dotenv

from convex import ConvexClient

load_dotenv("../.env.local")
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")
print(CONVEX_URL)
# or you can hardcode your deployment URL instead
# CONVEX_URL = "https://happy-otter-123.convex.cloud"

client = ConvexClient(CONVEX_URL)


for tasks in client.subscribe("question:getQuestionsByCategoryName", dict(categoryName="Film")):
    print(tasks)
    # this loop lasts forever, ctrl-c to exit it