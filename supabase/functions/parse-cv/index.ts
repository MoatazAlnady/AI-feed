import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText, fileName } = await req.json();
    
    if (!cvText || cvText.trim().length === 0) {
      throw new Error("No CV text provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Parsing CV: ${fileName}, text length: ${cvText.length}`);

    const systemPrompt = `You are an expert CV/Resume parser. Extract ALL information with extreme precision, especially dates.

CRITICAL DATE PARSING RULES:
- Look for date patterns: "Jan 2020 - Present", "2019-2022", "March 2018 to December 2020", "01/2020 - 12/2022"
- Parse months: Jan/January=1, Feb/February=2, Mar/March=3, Apr/April=4, May=5, Jun/June=6, Jul/July=7, Aug/August=8, Sep/September=9, Oct/October=10, Nov/November=11, Dec/December=12
- If only year is given, use null for month
- "Present", "Current", "Now", "Ongoing", "Till Date" means is_current=true and end dates are null
- For each experience, extract BOTH start AND end dates separately
- Pay attention to date ranges in any format

Extract the following JSON structure:
{
  "full_name": "string or null",
  "job_title": "Current/most recent job title or null",
  "company": "Current/most recent company or null",
  "city": "string or null",
  "country": "string or null",
  "bio": "Professional summary max 200 chars or null",
  "skills": ["array of up to 15 skills"],
  "languages": [{"language": "English", "level": 5}],
  
  "experiences": [
    {
      "job_title": "Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "employment_type": "full-time",
      "start_month": 3,
      "start_year": 2020,
      "end_month": null,
      "end_year": null,
      "is_current": true,
      "description": "Led development of AI features...",
      "skills_used": ["Python", "Machine Learning"]
    }
  ],
  
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "MIT",
      "field_of_study": "Computer Science",
      "start_year": 2015,
      "end_year": 2019,
      "grade": "3.8 GPA"
    }
  ],
  
  "certifications": [
    {
      "name": "AWS Solutions Architect",
      "issuer": "Amazon Web Services",
      "issue_month": 6,
      "issue_year": 2021,
      "expiry_month": null,
      "expiry_year": null,
      "credential_id": "ABC123"
    }
  ]
}

IMPORTANT INSTRUCTIONS:
- Extract ALL work experiences found in the CV, not just the most recent one
- Be precise with date parsing - extract exact months when available
- For employment_type, infer from context: "full-time", "part-time", "contract", "freelance", "internship"
- For language levels: 1=Basic, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Native/Fluent
- For skills, prioritize: AI/ML skills, programming languages, frameworks, cloud platforms, tools
- Return ONLY the JSON object, no markdown or explanation
- If a field cannot be determined, use null for strings or empty array for arrays`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this CV and extract ALL information including every work experience, education, and certification:\n\n${cvText.substring(0, 20000)}` }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    console.log("AI response:", content.substring(0, 1000));

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonString = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    } else {
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      parsed = {};
    }

    // Helper function to validate month
    const validateMonth = (month: any): number | null => {
      if (typeof month === 'number' && month >= 1 && month <= 12) {
        return Math.round(month);
      }
      return null;
    };

    // Helper function to validate year
    const validateYear = (year: any): number | null => {
      if (typeof year === 'number' && year >= 1950 && year <= new Date().getFullYear() + 5) {
        return Math.round(year);
      }
      return null;
    };

    // Validate and normalize the parsed data
    const normalizedData = {
      full_name: typeof parsed.full_name === 'string' ? parsed.full_name : null,
      job_title: typeof parsed.job_title === 'string' ? parsed.job_title : null,
      company: typeof parsed.company === 'string' ? parsed.company : null,
      city: typeof parsed.city === 'string' ? parsed.city : null,
      country: typeof parsed.country === 'string' ? parsed.country : null,
      bio: typeof parsed.bio === 'string' ? parsed.bio.substring(0, 200) : null,
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string').slice(0, 15) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages
        .filter((l: any) => l && typeof l.language === 'string' && typeof l.level === 'number')
        .map((l: any) => ({ language: l.language, level: Math.min(5, Math.max(1, Math.round(l.level))) }))
        : [],
      
      // Detailed experiences with validated dates
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences
        .filter((exp: any) => exp && exp.job_title && exp.company && exp.start_year)
        .map((exp: any) => ({
          job_title: exp.job_title,
          company: exp.company,
          location: exp.location || null,
          employment_type: ['full-time', 'part-time', 'contract', 'freelance', 'internship'].includes(exp.employment_type) 
            ? exp.employment_type 
            : 'full-time',
          start_month: validateMonth(exp.start_month),
          start_year: validateYear(exp.start_year) || new Date().getFullYear(),
          end_month: exp.is_current ? null : validateMonth(exp.end_month),
          end_year: exp.is_current ? null : validateYear(exp.end_year),
          is_current: Boolean(exp.is_current),
          description: typeof exp.description === 'string' ? exp.description.substring(0, 2000) : null,
          skills_used: Array.isArray(exp.skills_used) ? exp.skills_used.filter((s: any) => typeof s === 'string').slice(0, 10) : []
        }))
        : [],
      
      // Education
      education: Array.isArray(parsed.education) ? parsed.education
        .filter((edu: any) => edu && edu.institution)
        .map((edu: any) => ({
          degree: typeof edu.degree === 'string' ? edu.degree : null,
          institution: edu.institution,
          field_of_study: typeof edu.field_of_study === 'string' ? edu.field_of_study : null,
          start_year: validateYear(edu.start_year),
          end_year: validateYear(edu.end_year),
          grade: typeof edu.grade === 'string' ? edu.grade : null
        }))
        : [],
      
      // Certifications
      certifications: Array.isArray(parsed.certifications) ? parsed.certifications
        .filter((cert: any) => cert && cert.name)
        .map((cert: any) => ({
          name: cert.name,
          issuer: typeof cert.issuer === 'string' ? cert.issuer : null,
          issue_month: validateMonth(cert.issue_month),
          issue_year: validateYear(cert.issue_year),
          expiry_month: validateMonth(cert.expiry_month),
          expiry_year: validateYear(cert.expiry_year),
          credential_id: typeof cert.credential_id === 'string' ? cert.credential_id : null
        }))
        : []
    };

    console.log("Parsed CV data:", JSON.stringify({
      ...normalizedData,
      experiences_count: normalizedData.experiences.length,
      education_count: normalizedData.education.length,
      certifications_count: normalizedData.certifications.length
    }));

    return new Response(JSON.stringify({ success: true, data: normalizedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("CV parsing error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
