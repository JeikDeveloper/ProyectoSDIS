from deepgram import DeepgramClient
from app.config import settings

deepgram = DeepgramClient(api_key= settings.DEEPGRAM_API_KEY)

async def generar_audio_actividad(actividad: str) -> bytes:
    response = deepgram.speak.v1.audio.generate(
        text=actividad,
        model="aura-2-celeste-es",
        encoding="mp3",
    )

    if hasattr(response, "stream"):
        return response.stream.getvalue()
    else:
        return b"".join(response)