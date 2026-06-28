import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Helper to convert a File object to the format expected by the Gemini API
 * For browser usage, we need to convert to base64.
 */
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

/**
 * Analyzes an image of a community issue.
 * Expects the AI to return a JSON object with categorization.
 */
export async function analyzeIssueImage(imageFile) {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    // We use gemini-2.5-flash as it's the recommended model for general text/multimodal tasks
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        "You are an AI assistant for a community issue reporting app. Analyze this image and provide: 1. A short, descriptive title for the issue. 2. A category (e.g., 'Pothole', 'Waste', 'Streetlight', 'Water Leak', 'Other'). 3. A severity rating from 1 to 5 (1 = minor, 5 = critical hazard). Return ONLY a raw JSON object with keys: 'title', 'category', 'severity'. Do not use markdown backticks.",
        imagePart
      ],
    });

    const text = response.text;
    try {
      // Defensive parsing: sometimes Gemini still wraps in markdown or adds text.
      const jsonStr = text.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(jsonStr);
      return { success: true, data: result };
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", text);
      return { success: false, error: "AI returned an ambiguous response.", rawText: text };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { success: false, error: "Failed to connect to AI service." };
  }
}

/**
 * Checks for duplicates by comparing a new report to existing nearby reports.
 */
export async function checkDuplicates(newImageFile, newDescription, nearbyIssues) {
  if (!nearbyIssues || nearbyIssues.length === 0) {
    return { isDuplicate: false };
  }

  try {
    const imagePart = await fileToGenerativePart(newImageFile);
    const nearbyIssuesContext = nearbyIssues.map(issue => 
      `Issue ID: ${issue.id}, Title: ${issue.title}, Category: ${issue.category}, Status: ${issue.status}`
    ).join("\n");

    const prompt = `You are a duplicate detection system for community issues.
A user is submitting a new issue with the attached image and the following description: "${newDescription}".
Here are existing issues reported nearby recently:
${nearbyIssuesContext}

Determine if the new issue is highly likely to be a duplicate of one of the existing issues.
Return ONLY a raw JSON object with keys: 
'isDuplicate' (boolean), 
'duplicateOfId' (string, the ID of the matched issue, or null if none), 
'confidence' (number 0-100),
'reason' (short string explaining why).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt, imagePart],
    });

    const text = response.text;
    const jsonStr = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(jsonStr);
    
  } catch (error) {
    console.error("Duplicate check failed:", error);
    // On failure, we assume it's not a duplicate so we don't block the user.
    return { isDuplicate: false };
  }
}

/**
 * Compares before and after images to verify resolution.
 */
export async function verifyResolution(beforeImageBlob, afterImageBlob) {
  try {
    const beforeImagePart = {
      inlineData: { data: await blobToBase64(beforeImageBlob), mimeType: beforeImageBlob.type },
    };
    const afterImagePart = {
      inlineData: { data: await blobToBase64(afterImageBlob), mimeType: afterImageBlob.type },
    };
    
    const prompt = `You are a verification system for a community issue reporting app.
I am providing two images. The first is a "Before" image showing an issue (e.g., a pothole, trash).
The second is an "After" image showing the same location after the issue has been allegedly resolved.

Determine if the issue shown in the "Before" image has been successfully resolved in the "After" image.
Return ONLY a raw JSON object with keys:
'isResolved' (boolean),
'confidence' (number 0-100),
'reason' (short string explaining why).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt, beforeImagePart, afterImagePart],
    });

    const text = response.text;
    const jsonStr = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Resolution verification failed:", error);
    return { isResolved: false, error: "Verification failed." };
  }
}

async function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}
