# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import Optional
# from convex import ConvexClient
# from openai import OpenAI
# import os

# app = FastAPI()
# CONVEX_URL = os.environ.get("NEXT_PUBLIC_CONVEX_URL", "https://your-convex-instance.convex.cloud/api")
# client = ConvexClient(CONVEX_URL)

# class JudgeRequest(BaseModel):
#     ai_ans_id: str
#     user_text: str

# class SimRequest(BaseModel):
#     ai_ans_id: str
#     user_text: str
#     model: str = "kimi"  # "kimi" 或 "minimax"

# class ReasonRequest(BaseModel):
#     question_id: str
#     user_text: str
#     score_type: str = "float"  # "float"(0-1) 或 "int"(1-100)

# @app.post("/judge_user_answer")
# def judge_user_answer(req: JudgeRequest):
#     # 1. 获取AI答案内容
#     ai_ans = client.query("question:getAIAnswer", dict(questionId=req.ai_ans_id))
#     if not ai_ans or not ai_ans[0]:
#         raise HTTPException(status_code=404, detail="未找到AI答案")
#     ai_text = ai_ans[0]["content"]
#     # 2. 计算相似度
#     from sentence_transformers import SentenceTransformer, util
#     model = SentenceTransformer('all-MiniLM-L6-v2')
#     emb_ai = model.encode(ai_text, convert_to_tensor=True)
#     emb_user = model.encode(req.user_text, convert_to_tensor=True)
#     sim_score = float(util.pytorch_cos_sim(emb_ai, emb_user))
#     # 3. 用Kimi和MiniMax判断合理性
#     kimi_reason = kimi_judge_reasonableness(ai_text, req.user_text)
#     minimax_reason = minimax_judge_reasonableness(ai_text, req.user_text)
#     return {
#         "similarity": sim_score,
#         "kimi_reasonableness": kimi_reason,
#         "minimax_reasonableness": minimax_reason
#     }

# @app.post("/similarity")
# def calc_similarity(req: SimRequest):
#     ai_ans = client.query("question:getAIAnswer", dict(questionId=req.ai_ans_id))
#     if not ai_ans or not ai_ans[0]:
#         raise HTTPException(status_code=404, detail="未找到AI答案")
#     ai_text = ai_ans[0]["content"]
#     prompt = f"AI的标准答案：{ai_text}\n用户的回答：{req.user_text}\n请你用0到1的分数严格判定两者内容的相似度，1为完全相同，0为完全不同，只返回分数，不要解释。"
#     if req.model == "kimi":
#         client_kimi = OpenAI(
#             api_key = os.getenv("KIMI_API_KEY"),
#             base_url = "https://api.moonshot.cn/v1",
#         )
#         completion = client_kimi.chat.completions.create(
#             model = "kimi-k2-0711-preview",
#             messages = [
#                 {"role": "system", "content": "你是一个严格的相似度判分助手。"},
#                 {"role": "user", "content": prompt}
#             ],
#             temperature = 0.3,
#         )
#         score = extract_score(completion.choices[0].message.content)
#     elif req.model == "minimax":
#         group_id = os.getenv("MINIMAX_GROUP")
#         api_key = os.getenv("MINIMAX")
#         url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
#         headers = {"Authorization":f"Bearer {api_key}", "Content-Type":"application/json"}
#         request_body = {
#             "model": "MiniMax-Text-01",
#             "tokens_to_generate": 1024,
#             "reply_constraints": {"sender_type": "BOT", "sender_name": "MM智能助理"},
#             "messages": [
#                 {"sender_type": "USER", "sender_name": "小明", "text": prompt}
#             ],
#             "bot_setting": [
#                 {
#                     "bot_name": "MM智能助理",
#                     "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。"
#                 }
#             ],
#         }
#         import requests
#         score = None
#         try:
#             response = requests.post(url, headers=headers, json=request_body)
#             if response.status_code == 200:
#                 score = extract_score(response.json().get("reply"))
#         except Exception as e:
#             score = None
#     else:
#         raise HTTPException(status_code=400, detail="model 只能为 kimi 或 minimax")
#     if score is None:
#         raise HTTPException(status_code=500, detail="大模型未返回有效分数")
#     return {"similarity": score}

# @app.post("/reasonableness")
# def judge_reasonableness(req: ReasonRequest):
#     question = client.query("question:getQuestionById", dict(id=req.question_id))
#     if not question:
#         raise HTTPException(status_code=404, detail="未找到问题")
#     question_text = question["body"]
#     prompt = f"问题：{question_text}\n用户的回答：{req.user_text}\n请你用0到1的分数严格判定用户回答的合理性，1为完全合理，0为完全不合理，只返回分数，不要解释。"
#     # Kimi
#     client_kimi = OpenAI(
#         api_key = os.getenv("KIMI_API_KEY"),
#         base_url = "https://api.moonshot.cn/v1",
#     )
#     kimi_resp = client_kimi.chat.completions.create(
#         model = "kimi-k2-0711-preview",
#         messages = [
#             {"role": "system", "content": "你是一个严格的答案判分助手。"},
#             {"role": "user", "content": prompt}
#         ],
#         temperature = 0.3,
#     )
#     kimi_score = extract_score(kimi_resp.choices[0].message.content)
#     # MiniMax
#     group_id = os.getenv("MINIMAX_GROUP")
#     api_key = os.getenv("MINIMAX")
#     url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
#     headers = {"Authorization":f"Bearer {api_key}", "Content-Type":"application/json"}
#     request_body = {
#         "model": "MiniMax-Text-01",
#         "tokens_to_generate": 1024,
#         "reply_constraints": {"sender_type": "BOT", "sender_name": "MM智能助理"},
#         "messages": [
#             {"sender_type": "USER", "sender_name": "小明", "text": prompt}
#         ],
#         "bot_setting": [
#             {
#                 "bot_name": "MM智能助理",
#                 "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。"
#             }
#         ],
#     }
#     import requests
#     minimax_score = None
#     try:
#         response = requests.post(url, headers=headers, json=request_body)
#         if response.status_code == 200:
#             minimax_score = extract_score(response.json().get("reply"))
#     except Exception as e:
#         minimax_score = None
#     # 均值
#     scores = [s for s in [kimi_score, minimax_score] if s is not None]
#     if not scores:
#         raise HTTPException(status_code=500, detail="两个模型都未返回有效分数")
#     avg = sum(scores) / len(scores)
#     if req.score_type == "int":
#         kimi_score = int(round(kimi_score * 100)) if kimi_score is not None else None
#         minimax_score = int(round(minimax_score * 100)) if minimax_score is not None else None
#         avg = int(round(avg * 100))
#     return {
#         "kimi_score": kimi_score,
#         "minimax_score": minimax_score,
#         "average": avg
#     }

# def extract_score(text):
#     """
#     从模型输出中提取0-1之间的分数。
#     """
#     import re
#     if not text:
#         return None
#     # 匹配0-1之间的浮点数
#     match = re.search(r"([01](?:\.\d+)?|0?\.\d+)", text)
#     if match:
#         score = float(match.group(1))
#         if 0 <= score <= 1:
#             return score
#     return None

# if __name__ == "__main__":
#     # 假设有真实id
#     test_ai_ans_id = "jd7fshzz805j92emwt78rt59a17mcseq"
#     test_question_id = "j979egr0zgd87scnyjcns94qn97mcc0c"
#     user_text = "这是用户的测试回答"

#     # 测试 similarity
#     print("=== 测试大模型相似度 ===")
#     sim_req = SimRequest(ai_ans_id=test_ai_ans_id, user_text=user_text, model="kimi")
#     try:
#         sim_result = calc_similarity(sim_req)
#         print("Kimi相似度：", sim_result)
#     except Exception as e:
#         print("Kimi相似度出错：", e)

#     sim_req = SimRequest(ai_ans_id=test_ai_ans_id, user_text=user_text, model="minimax")
#     try:
#         sim_result = calc_similarity(sim_req)
#         print("MiniMax相似度：", sim_result)
#     except Exception as e:
#         print("MiniMax相似度出错：", e)

#     # 测试 reasonableness
#     print("=== 测试大模型合理性 ===")
#     reason_req = ReasonRequest(question_id=test_question_id, user_text=user_text, score_type="float")
#     try:
#         reason_result = judge_reasonableness(reason_req)
#         print("合理性判分：", reason_result)
#     except Exception as e:
#         print("合理性判分出错：", e)
        

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from convex import ConvexClient
from openai import OpenAI
import os
import requests

app = FastAPI()
from dotenv import load_dotenv
load_dotenv("../.env.local")
CONVEX_URL = os.environ.get("NEXT_PUBLIC_CONVEX_URL", "https://your-convex-instance.convex.cloud/api")
client = ConvexClient(CONVEX_URL)

class SimRequest(BaseModel):
    ai_ans_id: str
    user_text: str
    model: str = "kimi"  # "kimi" 或 "minimax"

class ReasonRequest(BaseModel):
    question_id: str
    user_text: str
    score_type: str = "float"  # "float"(0-1) 或 "int"(1-100)

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

@app.post("/similarity")
def calc_similarity(req: SimRequest):
    print("ai_ans")
    ai_ans = client.query("question:getAIAnswer", dict(questionId=req.ai_ans_id))
    print(ai_ans)
    if not ai_ans or not ai_ans[0]:
        raise HTTPException(status_code=404, detail="未找到AI答案")
    ai_text = ai_ans[0]["content"]
    prompt = f"AI的标准答案：{ai_text}\n用户的回答：{req.user_text}\n请你用0到1的分数严格判定两者内容的相似度，1为完全相同，0为完全不同，只返回分数，不要解释。"
    if req.model == "kimi":
        client_kimi = OpenAI(
            api_key = os.getenv("KIMI_API_KEY"),
            base_url = "https://api.moonshot.cn/v1",
        )
        completion = client_kimi.chat.completions.create(
            model = "kimi-k2-0711-preview",
            messages = [
                {"role": "system", "content": "你是一个严格的相似度判分助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature = 0.3,
        )
        score = extract_score(completion.choices[0].message.content)
    elif req.model == "minimax":
        group_id = os.getenv("MINIMAX_GROUP")
        api_key = os.getenv("MINIMAX")
        url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
        headers = {"Authorization":f"Bearer {api_key}", "Content-Type":"application/json"}
        request_body = {
            "model": "MiniMax-Text-01",
            "tokens_to_generate": 1024,
            "reply_constraints": {"sender_type": "BOT", "sender_name": "MM智能助理"},
            "messages": [
                {"sender_type": "USER", "sender_name": "小明", "text": prompt}
            ],
            "bot_setting": [
                {
                    "bot_name": "MM智能助理",
                    "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。"
                }
            ],
        }
        score = None
        try:
            response = requests.post(url, headers=headers, json=request_body)
            if response.status_code == 200:
                score = extract_score(response.json().get("reply"))
        except Exception as e:
            score = None
    else:
        raise HTTPException(status_code=400, detail="model 只能为 kimi 或 minimax")
    if score is None:
        raise HTTPException(status_code=500, detail="大模型未返回有效分数")
    return {"similarity": score}

@app.post("/reasonableness")
def judge_reasonableness(req: ReasonRequest):
    question = client.query("question:getQuestionById", dict(id=req.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="未找到问题")
    question_text = question["body"]
    prompt = f"问题：{question_text}\n用户的回答：{req.user_text}\n请你用0到1的分数严格判定用户回答的合理性，1为完全合理，0为完全不合理，只返回分数，不要解释。"
    # Kimi
    client_kimi = OpenAI(
        api_key = os.getenv("KIMI_API_KEY"),
        base_url = "https://api.moonshot.cn/v1",
    )
    kimi_resp = client_kimi.chat.completions.create(
        model = "kimi-k2-0711-preview",
        messages = [
            {"role": "system", "content": "你是一个严格的答案判分助手。"},
            {"role": "user", "content": prompt}
        ],
        temperature = 0.3,
    )
    kimi_score = extract_score(kimi_resp.choices[0].message.content)
    # MiniMax
    group_id = os.getenv("MINIMAX_GROUP")
    api_key = os.getenv("MINIMAX")
    url = f"https://api.minimaxi.com/v1/text/chatcompletion_pro?GroupId={group_id}"
    headers = {"Authorization":f"Bearer {api_key}", "Content-Type":"application/json"}
    request_body = {
        "model": "MiniMax-Text-01",
        "tokens_to_generate": 1024,
        "reply_constraints": {"sender_type": "BOT", "sender_name": "MM智能助理"},
        "messages": [
            {"sender_type": "USER", "sender_name": "小明", "text": prompt}
        ],
        "bot_setting": [
            {
                "bot_name": "MM智能助理",
                "content": "MM智能助理是一款由MiniMax自研的，没有调用其他产品的接口的大型语言模型。MiniMax是一家中国科技公司，一直致力于进行大模型相关的研究。"
            }
        ],
    }
    minimax_score = None
    try:
        response = requests.post(url, headers=headers, json=request_body)
        if response.status_code == 200:
            minimax_score = extract_score(response.json().get("reply"))
    except Exception as e:
        minimax_score = None
    # 均值
    scores = [s for s in [kimi_score, minimax_score] if s is not None]
    if not scores:
        raise HTTPException(status_code=500, detail="两个模型都未返回有效分数")
    avg = sum(scores) / len(scores)
    if req.score_type == "int":
        kimi_score = int(round(kimi_score * 100)) if kimi_score is not None else None
        minimax_score = int(round(minimax_score * 100)) if minimax_score is not None else None
        avg = int(round(avg * 100))
    return {
        "kimi_score": kimi_score,
        "minimax_score": minimax_score,
        "average": avg
    }

if __name__ == "__main__":
    # 测试用真实id
    test_ai_ans_id = "jd7fshzz805j92emwt78rt59a17mcseq"
    test_question_id = "j979egr0zgd87scnyjcns94qn97mcc0c"
    user_text = "这是用户的测试回答"

    # 测试 similarity
    print("=== 测试大模型相似度 ===")
    sim_req = SimRequest(ai_ans_id=test_question_id, user_text=user_text, model="kimi")
    try:
        sim_result = calc_similarity(sim_req)
        print("Kimi相似度：", sim_result)
    except Exception as e:
        print("Kimi相似度出错：", e)

    sim_req = SimRequest(ai_ans_id=test_question_id, user_text=user_text, model="minimax")
    try:
        sim_result = calc_similarity(sim_req)
        print("MiniMax相似度：", sim_result)
    except Exception as e:
        print("MiniMax相似度出错：", e)

    # 测试 reasonableness
    print("=== 测试大模型合理性 ===")
    reason_req = ReasonRequest(question_id=test_question_id, user_text=user_text, score_type="float")
    try:
        reason_result = judge_reasonableness(reason_req)
        print("合理性判分：", reason_result)
    except Exception as e:
        print("合理性判分出错：", e)