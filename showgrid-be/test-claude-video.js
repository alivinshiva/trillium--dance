require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

// You can explicitly put your API key here, or load it from .env
const apiKey = process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE';

if (apiKey === 'YOUR_API_KEY_HERE' || !apiKey) {
    console.error("❌ Please provide an Anthropic API key in this file or via .env ('ANTHROPIC_API_KEY')");
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: apiKey,
});

const videoUrl = "";

async function testCloudAi() {
    try {
        console.log(`[TEST] Starting Claude evaluation for video:\n${videoUrl}\n`);
        console.log("[TEST] Sending request to Claude 3.5 Sonnet...");

        // Provide the video link and instructions to the AI
        const result = await anthropic.messages.create({
            model: "claude-opus-4-6",
            max_tokens: 1024,
            temperature: 0.7,
            system: "You are a creative and analytical AI that evaluates videos based on descriptions or links. If you cannot access the link directly, do your best based on the URL text and ask the user for more details.",
            messages: [
                {
                    role: "user",
                    content: `Please describe the following video URL:\n${videoUrl}\n\n1. What is this video about?\n2. Describe the "scent" or "vibe" of the video.`
                }
            ]
        });

        if (result && result.content && result.content.length > 0) {
            console.log("\n✅ [TEST] Success! Claude responded:\n");
            console.log(result.content[0].text);
        } else {
            console.warn("\n⚠️ [TEST] No data returned from API.");
        }

    } catch (error) {
        console.error("\n❌ [TEST] Error occurred while calling Anthropic API:\n");
        console.error(error);
        if (error.type === 'not_found_error') {
            console.error("\n💡 Hint: A 'not_found_error' with 'model: claude-3-5-sonnet-20241022' often means your API key tier (e.g., Build tier vs Scale tier) or account doesn't have access to this specific model yet, or it requires adding billing credits.");
        }
    }
}

testCloudAi();
