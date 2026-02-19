const { Client } = require("@gradio/client");

const SYSTEM_PROMPT = `You are the Grid Index Scoring Engine.

Your task is to evaluate a solo dance performance using extracted motion data, pose tracking data, beat detection data, and computed movement metrics. You must strictly follow the weighted scoring system below.

Be objective and mathematically consistent. Do not inflate scores. Do not provide emotional language. Return only the required JSON output.

SCORING PARAMETERS AND WEIGHTS

1. Synchronization — Weight: 20%
For solo performance, evaluate timing consistency, internal rhythm stability, and movement control across frames.
Inputs:
* Frame-to-frame joint variance
* Motion alignment consistency
* Stability of repeated sequences
Scoring logic:
Lower joint deviation and higher timing consistency result in a higher score.
Return a value from 0 to 10.

2. Musicality — Weight: 20%
Evaluate how well movement acceleration peaks align with detected beat timestamps.
Inputs:
* Beat timestamps from audio analysis
* Motion acceleration peaks
* Alignment window of ±100 milliseconds
Scoring logic:
Musicality Score = (Number of aligned motion peaks / Total detected beats)
Normalize to a 0 to 10 scale.
Return a value from 0 to 10.

3. Energy & Intensity — Weight: 15%
Evaluate:
* Average joint velocity
* Acceleration spikes
* Dynamic range variation
Higher sustained velocity with controlled variation results in a higher score.
Return a value from 0 to 10.

4. Choreography Complexity — Weight: 15%
Evaluate:
* Level changes (low, mid, high)
* Direction changes
* Pattern diversity
* Frequency of movement variation
Greater structured variation and diversity result in a higher score.
Return a value from 0 to 10.

5. Stage Utilization — Weight: 10%
Evaluate:
* Frame coverage percentage
* Horizontal and vertical spread
* Use of space without large dead zones
Higher spatial coverage results in a higher score.
Return a value from 0 to 10.

6. Visual Cleanliness — Weight: 20%
Evaluate:
* Stability during stops
* Micro-movement noise
* Clean transitions
* Strength and control in final pose
Lower noise and stronger controlled holds result in a higher score.
Return a value from 0 to 10.

FINAL SCORE FORMULA
Final Grid Index =
(0.20 × Synchronization) +
(0.20 × Musicality) +
(0.15 × Energy_Intensity) +
(0.15 × Choreography_Complexity) +
(0.10 × Stage_Utilization) +
(0.20 × Visual_Cleanliness)
Return the final score out of 10 rounded to two decimal places.

REQUIRED OUTPUT FORMAT
Return only the following JSON structure and nothing else:
{
"synchronization": 0.0,
"musicality": 0.0,
"energy_intensity": 0.0,
"choreography_complexity": 0.0,
"stage_utilization": 0.0,
"visual_cleanliness": 0.0,
"final_grid_index": 0.00,
"verdict_summary": "1-2 sentence technical explanation of strongest and weakest parameter."
}
Do not include markdown formatting.
Do not include explanations outside the JSON.
Do not add extra fields.
Be mathematically accurate and consistent with the defined weights.`;

/**
 * Generates AI rating for a video URL using Gradio client.
 * @param {string} videoUrl - The public URL of the video (e.g., Cloudinary).
 * @returns {Promise<Object|null>} - The rating object or null if failed.
 */
async function generateAiRating(videoUrl) {
    try {
        console.log(`[AI-RATING] Starting analysis for: ${videoUrl}`);

        // Check for Mock Mode
        if (process.env.MOCK_AI === 'true') {
            console.log("[AI-RATING] ⚠️  RUNNING IN MOCK MODE ⚠️");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate delay
            return {
                synchronization: 8.5,
                musicality: 7.0,
                energy_intensity: 9.0,
                choreography_complexity: 8.5,
                stage_utilization: 9.0,
                visual_cleanliness: 8.0,
                final_grid_index: 8.48,
                verdict_summary: "High synchronization and energy intensity dominate the performance, while musicality shows moderate alignment. Spatial utilization is excellent but visual cleanliness has minor room for improvement."
            };
        }

        console.log(`[AI-RATING] Fetching video blob...`);
        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error(`Failed to fetch video from Cloudinary: ${response.statusText}`);
        const videoBlob = await response.blob();

        console.log("[AI-RATING] Connecting to Gradio API...");
        const client = await Client.connect("prithivMLmods/Qwen3-VL-Outpost", {
            hf_token: process.env.HF_TOKEN
        });

        console.log("[AI-RATING] Sending request to AI model...");
        const result = await client.predict("/generate_video", {
            model_name: "Qwen3-VL-4B-Instruct",
            text: SYSTEM_PROMPT,
            video_path: videoBlob,
            max_new_tokens: 1024,
            temperature: 0.6,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.2,
            gpu_timeout: 45, // Increased timeout 
        });

        if (result.data && result.data.length > 0) {
            console.log("[AI-RATING] Success!");
            // The result is usually a JSON string in markdown code block or just string.
            // We need to parse it.
            let rawOutput = result.data[0];

            // Clean up markdown code blocks if present
            rawOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const jsonRating = JSON.parse(rawOutput);
                return jsonRating;
            } catch (e) {
                console.error("[AI-RATING] Failed to parse JSON output:", rawOutput);
                // Return partial or raw if parsing fails? For now return null.
                return null;
            }
        } else {
            console.warn("[AI-RATING] No data returned from API.");
            return null;
        }

    } catch (error) {
        console.error("[AI-RATING] Error:", error);
        return null;
    }
}

module.exports = { generateAiRating };
