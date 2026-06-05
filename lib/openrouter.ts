const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const BASE_URL = 'https://openrouter.ai/api/v1'

export async function summarizeArticle(
  title: string,
  content: string
): Promise<{ summary: string; tags: string[] }> {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    return { summary: '', tags: [] }
  }

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://medical-news-agent.vercel.app',
        'X-Title': 'Medical News Agent',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: `You are a medical news analyst. Analyze the article and respond with ONLY valid JSON (no markdown):
{
  "summary": "2-3 sentence Korean summary of key medical findings",
  "tags": ["up to 5 relevant tags in Korean or English"]
}`,
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${content.substring(0, 2500)}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.2,
      }),
    })

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`)

    const data = await res.json()
    const text: string = data.choices?.[0]?.message?.content || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { summary: text.substring(0, 300), tags: [] }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      summary: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    }
  } catch (err) {
    console.error('OpenRouter error:', err)
    return { summary: '', tags: [] }
  }
}
