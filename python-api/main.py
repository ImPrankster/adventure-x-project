# fastapi_app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
from openai import OpenAI
import os
from dotenv import load_dotenv
from convex import ConvexClient

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

load_dotenv("../.env.local")
CONVEX_URL = os.environ.get(
    "NEXT_PUBLIC_CONVEX_URL", "https://your-convex-instance.convex.cloud/api"
)  # 从环境变量获取URL

# 初始化 ConvexClient
client = ConvexClient(CONVEX_URL)


@app.get("/health")
def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "healthy", "message": "API is running"}


class InsertRequest(BaseModel):
    question_id: str


class GenAnsRequest(BaseModel):
    question_id: Optional[str] = None
    category_name: Optional[str] = None
    # 可扩展更多参数


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
            dict(questionId=question_id, content=content, aiName=ai_name),
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
        api_key=os.getenv("KIMI"),
        base_url="https://api.moonshot.cn/v1",
    )
    completion = client.chat.completions.create(
        model="kimi-k2-0711-preview",
        messages=[
            {
                "role": "system",
                "content": "你是最常见的小红书用户回答者，请用小红书常见、不长篇大论的方式回答问题。你只需给出最常见的普通人会怎么答，不要写太多。",
            },
            {"role": "user", "content": text},
        ],
        temperature=0.6,
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
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    request_body = {
        "model": "MiniMax-Text-01",
        "tokens_to_generate": 1024,
        "reply_constraints": {"sender_type": "BOT", "sender_name": "简洁明了知乎用户"},
        "messages": [{"sender_type": "USER", "sender_name": "中枢控制", "text": text}],
        "bot_setting": [
            {
                "bot_name": "简洁明了知乎用户",
                "content": (
                    "请简洁明了地回答问题，不要长篇大论。你是一个知乎的普通用户，"
                ),
            }
        ],
    }

    response = requests.post(url, headers=headers, json=request_body)
    if response.status_code == 200:
        minimax_answer = response.json().get("reply")
        print("minimax 回答", minimax_answer)
        insert_ai_answer_to_convex(question_id, minimax_answer, "MiniMax")
    else:
        print(f"[MiniMax ERROR] {response.status_code}: {response.text}")


@app.post("/gen_ai_answers")
def gen_ai_answers(req: GenAnsRequest):
    # 1. 获取 question_id，如果没有则从分类中取第一个问题
    question_id = req.question_id
    if not question_id:
        if not req.category_name:
            raise HTTPException(
                status_code=400, detail="question_id 或 category_name 必须提供"
            )
        questions = client.query(
            "question:getQuestionsByCategoryName", dict(categoryName=req.category_name)
        )
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


class SimRequest(BaseModel):
    question_id: str
    user_text: str
    model: str = "kimi"  # "kimi" 或 "minimax"


class ReasonRequest(BaseModel):
    question_id: str
    user_text: str
    score_type: str = "float"  # "float"(0-1) 或 "int"(1-100)


class MultiSimRequest(BaseModel):
    question_id: str  # questionId
    user_text: str
    sim_model: str = "kimi"  # "kimi" 或 "minimax"
    reason_model: str = "kimi"  # "kimi" 或 "minimax"
    score_type: str = "float"  # "float" 或 "int"


def extract_score(text):
    """
    从模型输出中提取0-1之间的分数。
    """
    import re

    if not text:
        return None
    match = re.search(r"([01](?:\.\d+)?|0?\.\d+)", text)
    if match:
        score = float(match.group(1))
        if 0 <= score <= 1:
            return score
    return None


"""
# 只需要调用这个，返回
多重判定结果： {'similarities': [{'ai_name': 'Kimi', 'similarity': 1.0}, {'ai_name': 'MiniMax', 'similarity': 0.85}], 
'reasonableness': [{'model': 'kimi', 'score': 0.9}, {'model': 'minimax', 'score': 1.0}]}
"""


@app.post("/multi_similarity_reasonableness")
def multi_similarity_reasonableness(req: MultiSimRequest):
    # 1. 获取所有AI答案
    ai_ans_list = client.query("question:getAIAnswer", dict(questionId=req.question_id))
    if not ai_ans_list:
        raise HTTPException(status_code=404, detail="未找到AI答案")
    # 2. 获取问题内容
    question = client.query("question:getQuestionById", dict(id=req.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="未找到问题")
    question_text = question["body"]
    user_text = req.user_text
    # 3. 计算每个AI答案与用户回答的相似度
    sim_results = []
    for ai_ans in ai_ans_list:
        ai_text = ai_ans["content"]
        prompt = f"AI的标准答案：{ai_text}\n用户的回答：{user_text}\n请你用0到1的分数严格判定两者内容的相似度，1为完全相同，0为完全不同，只返回分数，不要解释。"
        score = None
        if req.sim_model == "kimi":
            client_kimi = OpenAI(
                api_key=os.getenv("KIMI"),
                base_url="https://api.moonshot.cn/v1",
            )
            completion = client_kimi.chat.completions.create(
                model="kimi-k2-0711-preview",
                messages=[
                    {"role": "system", "content": "你是一个严格的相似度判分助手。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            score = extract_score(completion.choices[0].message.content)
        elif req.sim_model == "minimax":
            group_id = os.getenv("MINIMAX_GROUP")
            api_key = os.getenv("MINIMAX")
            url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            sim_request_body = {
                "model": "abab6-chat",
                "tokens_to_generate": 1024,
                "reply_constraints": {
                    "sender_type": "BOT",
                    "sender_name": "MM智能助理",
                },
                "messages": [
                    {"sender_type": "USER", "sender_name": "小明", "text": prompt}
                ],
                "bot_setting": [
                    {
                        "bot_name": "MM智能助理",
                        "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。",
                    }
                ],
            }
            import requests

            try:
                response = requests.post(url, headers=headers, json=sim_request_body)
                if response.status_code == 200:
                    score = extract_score(response.json().get("reply"))
            except Exception as e:
                score = None
        if req.score_type == "int" and score is not None:
            score = int(round(score * 100))
        sim_results.append(
            {"ai_name": ai_ans.get("aiName", "unknown"), "similarity": score}
        )

    # 4. 所有AI答案+用户回答，判定合理性
    reason_prompt = f"问题：{question_text}\n用户的回答：{user_text}\n请你用0到1的分数严格判定用户回答的合理性，1为完全合理，0为完全不合理，只返回分数，不要解释。"
    reason_score_kimi = None

    client_kimi = OpenAI(
        api_key=os.getenv("KIMI"),
        base_url="https://api.moonshot.cn/v1",
    )
    completion = client_kimi.chat.completions.create(
        model="kimi-k2-0711-preview",
        messages=[
            {"role": "system", "content": "你是一个严格的答案判分助手。"},
            {"role": "user", "content": reason_prompt},
        ],
        temperature=0.3,
    )
    reason_score_kimi = extract_score(completion.choices[0].message.content)

    group_id = os.getenv("MINIMAX_GROUP")
    api_key = os.getenv("MINIMAX")
    url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    reason_request_body = {
        "model": "abab6-chat",
        "tokens_to_generate": 1024,
        "reply_constraints": {"sender_type": "BOT", "sender_name": "MM智能助理"},
        "messages": [
            {"sender_type": "USER", "sender_name": "小明", "text": reason_prompt}
        ],
        "bot_setting": [
            {
                "bot_name": "MM智能助理",
                "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。",
            }
        ],
    }
    import requests

    try:
        response = requests.post(url, headers=headers, json=reason_request_body)
        if response.status_code == 200:
            reason_score_mini = extract_score(response.json().get("reply"))
    except Exception as e:
        reason_score_mini = None
    if req.score_type == "int" and reason_score_kimi is not None:
        reason_score_kimi = int(round(reason_score_kimi * 100))
    if req.score_type == "int" and reason_score_mini is not None:
        reason_score_mini = int(round(reason_score_mini * 100))

    reasonableness = []
    reasonableness.append({"model": "kimi", "score": reason_score_kimi})
    reasonableness.append({"model": "minimax", "score": reason_score_mini})
    return {
        "similarities": sim_results,
        "reasonableness": reasonableness,
    }


if __name__ == "__main__":
    # 测试用真实id
    test_question_id = "j972t9h03z1qe5ddv6b6ffyyqn7mccwh"
    user_text = "桂林市区出发→磨盘山码头/竹江码头→漓江精华段（杨堤-兴坪）→打卡20元人民币背景→兴坪古镇吃啤酒鱼→回市区。"

    # # 测试 multi_similarity_reasonableness
    # print("=== 测试多重相似度与合理性判定 ===")
    # multi_req = MultiSimRequest(question_id=test_question_id, user_text=user_text, sim_model="kimi", reason_model="kimi", score_type="float")
    # try:
    #     multi_result = multi_similarity_reasonableness(multi_req)
    #     print("多重判定结果：", multi_result)
    # except Exception as e:
    #     print("多重判定出错：", e)

    # 用真实id获取Kimi和MiniMax回答并写入
    question_id = "j97amy2kgmq2v20qbn6nkpppdx7md2vz"
    # 直接用该id查表获取title/body
    question = client.query("question:getQuestionById", dict(id=question_id))
    if question:
        question_db = {question_id: question["body"]}
        get_kimi_answer_by_id(question_id, question_db)
        get_minimax_answer_by_id(question_id, question_db)
    else:
        print(f"Question id {question_id} not found in database.")
