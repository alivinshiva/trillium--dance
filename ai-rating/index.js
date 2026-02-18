import { Client } from "@gradio/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const videoInput = process.argv[2];

    if (!videoInput) {
        console.error("Please provide a video file path or URL as an argument.");
        process.exit(1);
    }

    // Check for Mock Mode
    if (process.env.MOCK_AI === 'true') {
        console.log("⚠️  RUNNING IN MOCK MODE (Bypassing API) ⚠️");
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockResult = {
            synchronization: 8.5,
            musicality: 7.0,
            energy_intensity: 9.0,
            choreography_complexity: 8.5,
            stage_utilization: 9.0,
            visual_cleanliness: 8.0,
            final_grid_index: 8.48,
            verdict_summary: "High synchronization and energy intensity dominate the performance, while musicality shows moderate alignment. Spatial utilization is excellent but visual cleanliness has minor room for improvement."
        };
        console.log("\n--- AI Rating Result (MOCK) ---\n");
        console.log(mockResult);
        return;
    }

    try {
        // 1. Read System Prompt
        const systemPromptPath = path.join(__dirname, "system_prompt.txt");
        const systemPrompt = await fs.readFile(systemPromptPath, "utf-8");

        console.log("Reading system prompt...");

        // 2. Prepare Video Data
        let videoData;
        if (videoInput.startsWith("http://") || videoInput.startsWith("https://")) {
            console.log(`Fetching video from URL: ${videoInput}`);
            const response = await fetch(videoInput);
            if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
            videoData = await response.blob();
        } else {
            console.log(`Reading local video file: ${videoInput}`);
            const buffer = await fs.readFile(videoInput);
            // Blob is not directly available in Node.js < 18 global scope without polyfill, 
            // but recent Node versions have it. Formatting as a Blob for Gradio client.
            videoData = new Blob([buffer]);
        }

        // 3. Connect to Gradio Client
        console.log("Connecting to Gradio API...");
        const client = await Client.connect("prithivMLmods/Qwen3-VL-Outpost", {
            hf_token: process.env.HF_TOKEN
        });

        // 4. Predict
        console.log("Sending request to AI model...");
        const result = await client.predict("/generate_video", {
            model_name: "Qwen3-VL-4B-Instruct",
            text: systemPrompt,
            video_path: videoData,
            max_new_tokens: 1024,
            temperature: 0.6,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.2,
            gpu_timeout: 30,
        });

        // 5. Output Result
        console.log("\n--- AI Rating Result ---\n");
        if (result.data && result.data.length > 0) {
            console.log(result.data[0]); // Raw output
        } else {
            console.log("No data returned from API.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
