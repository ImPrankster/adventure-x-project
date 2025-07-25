'''
fastapi, react
根据convex的文档

输入
question id ,获取text
输出
插入数据库 doc文档

'''


# fastapi_app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
from openai import OpenAI
import os
from dotenv import load_dotenv
from convex import ConvexClient

app = FastAPI()
load_dotenv("../.env.local")
CONVEX_URL = os.environ.get("NEXT_PUBLIC_CONVEX_URL", "https://your-convex-instance.convex.cloud/api")  # 从环境变量获取URL



# 初始化 ConvexClient
client = ConvexClient(CONVEX_URL)

class InsertRequest(BaseModel):
    question_id: str

class GenAnsRequest(BaseModel):
    question_id: Optional[str] = None
    category_name: Optional[str] = None
    # 可扩展更多参数

def get_text_by_id(question_id):
    # 这里模拟获取 text，实际可查数据库或其他服务
    # 假设有个 dict 或数据库
    question_db = {
        "q1": "What is AI?",
        "q2": "Explain convex optimization.",
    }
    return question_db.get(question_id)


def insert_ai_answer_to_convex(question_id, content, ai_name):
    """
    使用 ConvexClient 插入AI回答到aiAnswer表。
    question_id: str (Convex question表的id)
    content: str (AI生成的回答)
    ai_name: str (如"Kimi"或"MiniMax")
    """
    try:
        inserted_id = client.mutation(
            "question:createSampleAIAnswer",
            dict(questionId=question_id, content=content, aiName=ai_name)
        )
        print(f"[Convex] 插入成功: {ai_name}, id: {inserted_id}")
    except Exception as e:
        print(f"[Convex ERROR] {ai_name}: {e}")

def get_kimi_answer_by_id(question_id, question_db):
    """
    根据 question_id 获取 text，调用 Kimi 模型并打印常见简洁回答。
    question_id: str
    question_db: dict, 形如 {id: text}
    """
    text = question_db.get(question_id)
    if not text:
        print(f"Question id {question_id} not found.")
        return
    client = OpenAI(
        api_key = os.getenv("KIMI"),
        base_url = "https://api.moonshot.cn/v1",
    )
    completion = client.chat.completions.create(
        model = "kimi-k2-0711-preview",
        messages = [
            {"role": "system", "content": "你是最常见的小红书用户回答者，请用小红书常见、不长篇大论的方式回答问题。你只需给出最常见的普通人会怎么答，不要写太多。"},
            {"role": "user", "content": text}
        ],
        temperature = 0.6,
    )
    kimi_answer = completion.choices[0].message.content
    print("kimi回答", kimi_answer)
    insert_ai_answer_to_convex(question_id, kimi_answer, "Kimi")

def get_minimax_answer_by_id(question_id, question_db):
    """
    根据 question_id 获取 text，调用 MiniMax 模型并打印回答。
    question_id: str
    question_db: dict, 形如 {id: text}
    """
    text = question_db.get(question_id)
    if not text:
        print(f"Question id {question_id} not found.")
        return
    group_id = os.getenv("MINIMAX_GROUP")
    api_key = os.getenv("MINIMAX")
    url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
    headers = {"Authorization":f"Bearer {api_key}", "Content-Type":"application/json"}
    request_body = {
        "model": "MiniMax-Text-01",
        "tokens_to_generate": 1024,
        "reply_constraints": {
            "sender_type": "BOT",
            "sender_name": "简洁明了知乎用户"
        },
        "messages": [
            {
                "sender_type": "USER",
                "sender_name": "中枢控制",
                "text": text
            }
        ],
        "bot_setting": [
            {
                "bot_name": "简洁明了知乎用户",
                "content": (
                    "请简洁明了地回答问题，不要长篇大论。你是一个知乎的普通用户，"
                )
            }
        ]
    }

    response = requests.post(url, headers=headers, json=request_body)
    if response.status_code == 200:
        minimax_answer = response.json().get("reply")
        print('minimax 回答', minimax_answer)
        insert_ai_answer_to_convex(question_id, minimax_answer, "MiniMax")
    else:
        print(f"[MiniMax ERROR] {response.status_code}: {response.text}")

def get_or_create_question_id(client, title, body, mainCategory, subCategory, userId=None):
    """
    先查找是否有相同title和body的问题，有则返回其id，否则新建并返回id。
    """
    # 查询是否已存在
    questions = client.query(
        "question:searchQuestions",
        dict(keyword=title)
    )
    for q in questions:
        if q["title"] == title and q["body"] == body:
            return q["_id"]
    # 不存在则新建
    args = dict(title=title, body=body, mainCategory=mainCategory, subCategory=subCategory)
    if userId:
        args["userId"] = userId
    question_id = client.mutation("question:createQuestion", args)
    return question_id

# 用法示例：
# question_id = get_or_create_question_id(client, "你的标题", "你的内容", "主分类", "子分类")
# insert_ai_answer_to_convex(question_id, kimi_answer, "Kimi")


@app.post("/gen_ai_answers")
def gen_ai_answers(req: GenAnsRequest):
    # 1. 获取 question_id，如果没有则从分类中取第一个问题
    question_id = req.question_id
    if not question_id:
        if not req.category_name:
            raise HTTPException(status_code=400, detail="question_id 或 category_name 必须提供")
        questions = client.query("question:getQuestionsByCategoryName", dict(categoryName=req.category_name))
        if not questions:
            raise HTTPException(status_code=404, detail="该分类下没有问题")
        question = questions[0]
        question_id = question["_id"]
        body = question["body"]
    else:
        question = client.query("question:getQuestionById", dict(id=question_id))
        if not question:
            raise HTTPException(status_code=404, detail="未找到该问题")
        body = question["body"]
    # 2. 生成 Kimi 和 MiniMax 回答并写入数据库
    question_db = {question_id: body}
    get_kimi_answer_by_id(question_id, question_db)
    get_minimax_answer_by_id(question_id, question_db)
    return {"msg": "AI回答已生成并写入数据库", "question_id": question_id}


if __name__ == "__main__":

    # 用真实id获取Kimi和MiniMax回答并写入
    question_id = "j972t9h03z1qe5ddv6b6ffyyqn7mccwh"
    # 直接用该id查表获取title/body
    question = client.query("question:getQuestionById", dict(id=question_id))
    if question:
        question_db = {question_id: question["body"]}
        get_kimi_answer_by_id(question_id, question_db)
        get_minimax_answer_by_id(question_id, question_db)
    else:
        print(f"Question id {question_id} not found in database.")