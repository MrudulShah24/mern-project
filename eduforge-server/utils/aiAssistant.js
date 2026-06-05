const axios = require('axios');

// Set of common stopwords to filter out from searches
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent',
  'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its',
  'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than',
  'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these',
  'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats',
  'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with',
  'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself',
  'yourselves', 'please', 'course', 'courses', 'recommend', 'suggest', 'find', 'show', 'need', 'want', 
  'learn', 'looking', 'tell', 'website', 'platform', 'good', 'best', 'any'
]);

const cleanWord = (word) => {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

/**
 * Tokenizes a text query, filters stopwords, and calculates overlap/relevance score
 * @param {string} query - The user search query
 * @param {string} documentText - The text body to match
 * @param {string} titleText - The title (weighted higher)
 * @param {string[]} tags - The tags array (weighted higher)
 * @returns {number} Relevance score
 */
const tokenizeAndScore = (query, documentText = '', titleText = '', tags = []) => {
  if (!query) return 0;
  
  // Clean and tokenize query
  const queryTokens = query.split(/\s+/)
    .map(cleanWord)
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
    
  if (queryTokens.length === 0) return 0;

  // Clean document components
  const docTokens = new Set(documentText.split(/\s+/).map(cleanWord));
  const titleTokens = new Set(titleText.split(/\s+/).map(cleanWord));
  const cleanTags = new Set((tags || []).map(t => cleanWord(t)));

  let score = 0;

  queryTokens.forEach(token => {
    // Exact match in title = 5 points
    if (titleTokens.has(token)) {
      score += 5;
    }
    // Partial substring match in title = 2 points
    else {
      for (const t of titleTokens) {
        if (t.includes(token) || token.includes(t)) {
          score += 2;
          break;
        }
      }
    }

    // Match in tags = 3 points
    if (cleanTags.has(token)) {
      score += 3;
    } else {
      for (const tg of cleanTags) {
        if (tg.includes(token) || token.includes(tg)) {
          score += 1.5;
          break;
        }
      }
    }

    // Match in body = 1 point
    if (docTokens.has(token)) {
      score += 1;
    } else {
      for (const doc of docTokens) {
        if (doc.includes(token) || token.includes(doc)) {
          score += 0.5;
          break;
        }
      }
    }
  });

  return score;
};

/**
 * Sends a prompt to the Google Gemini LLM API via REST
 * @param {string} prompt - The user query or message prompt
 * @param {string} systemInstruction - The context / system guidelines
 * @returns {Promise<string|null>} Response text, or null if API key is missing or fails
 */
const callGemini = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_gemini_api_key_here') || apiKey.trim() === '') {
    console.log('Gemini API key is not configured. Falling back to local NLP mode.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Construct the payload with system instruction prepended
    const fullText = systemInstruction 
      ? `System Instructions:\n${systemInstruction}\n\nUser Input:\n${prompt}`
      : prompt;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: fullText
            }
          ]
        }
      ]
    };

    console.log('Firing request to Google Gemini API...');
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30s timeout
    });

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    }

    console.warn('Gemini response format unexpected:', JSON.stringify(response.data));
    return null;
  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Gemini error details:', JSON.stringify(error.response.data));
    }
    return null; // Force fallback to local NLP
  }
};

module.exports = {
  tokenizeAndScore,
  callGemini
};
