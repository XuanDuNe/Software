import httpx
import os
from typing import Optional

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8002")
FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "YOUR_FIREBASE_SERVER_KEY_HERE")

async def send_push_notification_async(user_id: int, title: str, body: str, link_url: Optional[str] = None):

    print(f"--- SIMULATING PUSH NOTIFICATION (USER-SERVICE DISABLED) ---")
    print(f"To: User {user_id}")
    print(f"Title: {title}")
    print(f"Body: {body}")
    print(f"--- END SIMULATION ---")
    
    return 

    # ---  ĐÃ BỊ VÔ HIỆU HÓA ---

    # fcm_tokens = []
    # try:
    #     async with httpx.AsyncClient() as client:
    #         response = await client.get(f"{USER_SERVICE_URL}/internal/fcm-tokens/{user_id}")
    #         if response.status_code == 200:
    #             fcm_tokens = response.json().get("tokens", []) 
    #         else:
    #             print(f"Failed to get FCM tokens for user {user_id}. Status: {response.status_code}")
    #             return
    # except Exception as e:
    #     print(f"Error calling user-service: {e}")
    #     return

    # if not fcm_tokens:
    #     print(f"No FCM tokens found for user {user_id}. Skipping push notification.")
    #     return

    # headers = {
    #     "Authorization": f"key={FCM_SERVER_KEY}",
    #     "Content-Type": "application/json"
    # }
    # payload = {
    #     "registration_ids": fcm_tokens,
    #     "notification": {
    #         "title": title,
    #         "body": body
    #     },
    #     "data": {
    #         "click_action": link_url or "FLUTTER_NOTIFICATION_CLICK"
    #     }
    # }
    
    # print(f"--- SIMULATING PUSH NOTIFICATION ---")
    # print(f"To: User {user_id} (Tokens: {fcm_tokens})")
    # print(f"Title: {title}")
    # print(f"Body: {body}")
    # print(f"--- END SIMULATION ---")
    