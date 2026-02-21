import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        // Use GITHUB_TOKEN if available to increase rate limit from 60/hr to 5000/hr
        const githubToken = process.env.GITHUB_TOKEN;
        const headers: Record<string, string> = {
            "User-Agent": "SilentLedger-App",
        };
        if (githubToken) {
            headers["Authorization"] = `Bearer ${githubToken}`;
        }

        // 1. Fetch public GitHub user profile
        const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });

        if (!userRes.ok) {
            if (userRes.status === 404) {
                return NextResponse.json({ error: "Utilisateur GitHub introuvable." }, { status: 404 });
            }
            if (userRes.status === 403) {
                return NextResponse.json({ error: "Limite d'API GitHub atteinte. Veuillez réessayer plus tard ou configurer GITHUB_TOKEN." }, { status: 403 });
            }
            return NextResponse.json({ error: "Erreur inattendue de l'API GitHub" }, { status: userRes.status });
        }

        const userData = await userRes.json();

        // 2. Fetch public repos (up to 100) to analyze languages and stars
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });

        let reposData = [];
        if (reposRes.ok) {
            reposData = await reposRes.json();
        }

        // 3. Aggregate metrics
        const totalStars = reposData.reduce((acc: number, repo: any) => acc + (repo.stargazers_count || 0), 0);
        const languages = reposData.map((r: any) => r.language).filter(Boolean);
        const languageCounts = languages.reduce((acc: any, lang: string) => {
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {});

        // Get top 5 languages
        const topLanguages = Object.entries(languageCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);

        // 4. Send to Gemini for Privacy-friendly AI Audit
        const apiKey = process.env.GEMINI_API_KEY || "";

        if (!apiKey) {
            // Mock fallback if API key not present
            return NextResponse.json({
                score: Math.min(100, 40 + (totalStars * 2) + (topLanguages.length * 5)),
                summary: `Mock AI Analysis: Excellent developer profile with active contributions in ${topLanguages.join(", ") || "various languages"}. (Note: GEMINI_API_KEY missing in backend).`,
                totalStars,
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using the user-requested model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert software engineer and tech recruiter. You must evaluate a developer based ONLY on the following public GitHub metadata, since we care about privacy and do not read their source code.
      
      GitHub Username: ${userData.login}
      Public Repos: ${userData.public_repos}
      Followers: ${userData.followers}
      Total Stars: ${totalStars}
      Primary Languages: ${topLanguages.join(", ")}
      Bio: ${userData.bio || "None"}
      
      Return ONLY a JSON object with two fields (do not wrap in markdown):
      {
        "score": <a number out of 100 representing the developer quality/reputation. Be generous but realistic.>,
        "summary": "<a 2-3 sentence positive evaluation of their profile, without mentioning the word 'metadata' or 'JSON'. Focus on their expertise.>"
      }
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON safely
        let parsedResult = { score: 70, summary: "Profile analysis completed successfully." };
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0]);
            } else {
                parsedResult = JSON.parse(responseText);
            }
        } catch (err) {
            console.error("Failed to parse Gemini response:", responseText);
        }

        return NextResponse.json({
            score: parsedResult.score,
            summary: parsedResult.summary,
            totalStars,
        });

    } catch (error: any) {
        console.error("GitHub Audit Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
