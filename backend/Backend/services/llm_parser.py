# llm_parser.py — LLM-based structured JSON extraction via OpenRouter
import json
import os
import logging

import openai

logger = logging.getLogger(__name__)
_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPEN_ROUTER_SECRET_KEY")
        if not api_key:
            raise ValueError(
                "OPEN_ROUTER_SECRET_KEY environment variable is not set. "
                "Get a key from https://openrouter.ai/keys"
            )
        _client = openai.OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        logger.info("OpenRouter client initialised")
    return _client

# ISSUE IN PARSE JSON
def parse_to_json(detections: list, extra_context: str = "") -> dict:
    """
    Send clustered form detections to an LLM and get back structured JSON.

    Args:
        detections: List of detection dicts (with text, options, labels, bboxes).
        extra_context: Optional free-text context about the form.

    Returns:
        Parsed JSON dict, or an error dict if parsing / API call fails.
    """
    prompt = (
        "You are an AI that extracts structured form data from detected form elements.\n\n"
        "Given the following detected form elements (labels, checkboxes, text fields):\n"
        f"{json.dumps(detections, indent=2)}\n\n"
    )
    if extra_context:
        prompt += f"Additional context: {extra_context}\n\n"

    prompt += (
        "Analyze the form elements and return a structured JSON object representing "
        "the form's fields, their types (text_input, checkbox_group, label, etc.), "
        "and any extracted values.\n"
        "Return ONLY valid JSON — no markdown fences, no explanation."
    )

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b:free",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            timeout=30,
        )

        output = response.choices[0].message.content.strip()

        # Strip markdown code fences if the model wraps its answer
        if output.startswith("```"):
            output = output.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        return json.loads(output)

    except json.JSONDecodeError:
        logger.warning("LLM returned invalid JSON: %s", output)
        return {"error": "Invalid JSON from LLM", "raw": output}
    except openai.APIError as e:
        logger.error("OpenRouter API error: %s", e)
        return {"error": f"API error: {str(e)}"}
    except Exception as e:
        logger.error("Unexpected error in LLM parser: %s", e, exc_info=True)
        return {"error": f"Unexpected error: {str(e)}"}