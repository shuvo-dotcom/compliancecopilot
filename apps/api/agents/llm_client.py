from litellm import acompletion
from typing import Any


class LLMClient:
    """
    Universal LLM abstraction via LiteLLM.
    Supports any provider: OpenAI, Anthropic, Gemini, Ollama, Azure, Mistral, Groq, etc.
    The API key is injected per-request from the user's session. Never stored.
    """

    def __init__(self, api_key: str, model: str):
        """
        api_key: user's LLM key, received from request header X-LLM-Key
                 exists only in memory for the duration of this request
        model:   e.g. "gpt-4o", "claude-sonnet-4-6", "ollama/llama3", "gemini/gemini-pro"
        """
        self.api_key = api_key
        self.model = model

    async def complete(
        self,
        messages: list[dict],
        temperature: float = 0.1,
        max_tokens: int = 4096,
        response_format: Any = None,
    ) -> str:
        kwargs: dict[str, Any] = dict(
            model=self.model,
            messages=messages,
            api_key=self.api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if response_format:
            kwargs["response_format"] = response_format

        response = await acompletion(**kwargs)
        return response.choices[0].message.content

    @staticmethod
    def from_request(api_key: str, model: str) -> "LLMClient":
        """
        Factory method. Called at the start of every job.
        api_key comes from request header, never from DB.
        """
        if not api_key:
            raise ValueError("LLM key missing. Please enter your key in settings.")
        return LLMClient(api_key=api_key, model=model)
