/**
 * Deterministic on-device text extraction for patient demographics.
 * Uses regex and keyword matching to parse pasted text without network calls.
 */

export interface ExtractedDemographics {
  medicalRecordNumber?: string;
  petName?: string;
  ownerLastName?: string;
  species?: 'Canine' | 'Feline' | 'Other';
  breed?: string;
  sex?: 'Male' | 'Male Neutered' | 'Female' | 'Female Spayed';
  dateOfBirth?: string; // YYYY-MM-DD format
}

/**
 * Extract demographics from pasted text using deterministic pattern matching.
 * Returns best-effort values; missing fields remain undefined.
 */
export function extractDemographics(text: string): ExtractedDemographics {
  if (!text || typeof text !== 'string') {
    return {};
  }

  const result: ExtractedDemographics = {};
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  // Extract MRN (Medical Record Number)
  // Patterns: "MRN: A-12345", "Medical Record: 12345", "Record #: 12345", prefixed codes
  const mrnPatterns = [
    /(?:mrn|medical\s*record|record\s*#?|patient\s*#?)[:\s]+([a-z0-9-]+)/i,
    /\b([a-z]{1,3}[-\s]?\d{4,10})\b/i, // Alphanumeric codes like "A-12345", "A 12345", or "12345"
  ];
  for (const pattern of mrnPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.medicalRecordNumber = match[1].trim().replace(/\s+/g, '');
      break;
    }
  }

  // Extract Pet Name
  // Patterns: "Name: Buddy", "Pet: Buddy-Bear", "Patient: O'Malley", mixed case with common punctuation
  const namePatterns = [
    /(?:pet\s*name|patient\s*name|name)[:\s]+([a-z][\w\s'-]+?)(?:\n|$|,|\||owner|species|breed)/i,
    /(?:pet|patient)[:\s]+([a-z][\w\s'-]+?)(?:\n|$|,|\||owner|species|breed)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.petName = match[1].trim();
      break;
    }
  }
  // Fallback: first capitalized word sequence that's not a common label
  if (!result.petName) {
    const words = text.split(/\s+/);
    const excludeWords = ['name', 'pet', 'owner', 'species', 'breed', 'sex', 'male', 'female', 'canine', 'feline', 'date', 'birth', 'dob', 'mrn', 'record', 'medical'];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (/^[A-Z][\w'-]*$/.test(word) && !excludeWords.includes(word.toLowerCase())) {
        // Check if next word is also capitalized (multi-word name)
        if (i + 1 < words.length && /^[A-Z][\w'-]*$/.test(words[i + 1])) {
          result.petName = `${word} ${words[i + 1]}`;
        } else {
          result.petName = word;
        }
        break;
      }
    }
  }

  // Extract Owner Last Name
  // Patterns: "Owner: Smith", "Owner Last Name: O'Brien", "Last Name: Van Der Berg"
  const ownerPatterns = [
    /(?:owner\s*last\s*name|owner\s*name|owner)[:\s]+([a-z][\w\s'-]+?)(?:\n|$|,|\||species|breed|sex)/i,
    /(?:last\s*name)[:\s]+([a-z][\w\s'-]+?)(?:\n|$|,|\||species|breed|sex)/i,
  ];
  for (const pattern of ownerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.ownerLastName = match[1].trim();
      break;
    }
  }

  // Extract Species
  if (fullText.includes('dog') || fullText.includes('canine')) {
    result.species = 'Canine';
  } else if (fullText.includes('cat') || fullText.includes('feline')) {
    result.species = 'Feline';
  } else if (fullText.match(/\b(bird|rabbit|ferret|reptile|hamster|guinea pig)\b/i)) {
    result.species = 'Other';
  }

  // Extract Breed
  // Patterns: "Breed: Labrador Retriever", common breed names with spaces
  const breedPatterns = [
    /(?:breed)[:\s]+([a-z][\w\s'-]+?)(?:\n|$|,|\||sex|male|female|dob|date)/i,
  ];
  for (const pattern of breedPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.breed = match[1].trim();
      break;
    }
  }
  // Fallback: common breed keywords
  if (!result.breed) {
    const commonBreeds = [
      'labrador retriever', 'golden retriever', 'german shepherd', 'french bulldog',
      'labrador', 'retriever', 'shepherd', 'bulldog', 'beagle', 'poodle', 'terrier',
      'chihuahua', 'dachshund', 'boxer', 'husky', 'corgi', 'pug', 'shih tzu',
      'persian', 'siamese', 'maine coon', 'ragdoll', 'bengal', 'sphynx', 'tabby',
      'mixed breed', 'mixed', 'domestic shorthair', 'domestic longhair', 'dsh', 'dlh'
    ];
    for (const breed of commonBreeds) {
      if (fullText.includes(breed)) {
        result.breed = breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
  }

  // Extract Sex
  if (fullText.match(/\b(male\s*neutered|neutered\s*male|mn|castrated)\b/i)) {
    result.sex = 'Male Neutered';
  } else if (fullText.match(/\b(female\s*spayed|spayed\s*female|fs|spayed)\b/i)) {
    result.sex = 'Female Spayed';
  } else if (fullText.match(/\b(male|m)\b/i) && !fullText.match(/female/i)) {
    result.sex = 'Male';
  } else if (fullText.match(/\b(female|f)\b/i)) {
    result.sex = 'Female';
  }

  // Extract Date of Birth
  // Patterns: "DOB: 2020-01-15", "Date of Birth: 01/15/2020", "Born: 2020-01-15"
  const dobPatterns = [
    /(?:dob|date\s*of\s*birth|born)[:\s]+(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
    /(?:dob|date\s*of\s*birth|born)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
    /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/, // Standalone date
  ];
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1];
      const normalized = normalizeDateString(dateStr);
      if (normalized) {
        result.dateOfBirth = normalized;
        break;
      }
    }
  }

  return result;
}

/**
 * Normalize various date formats to YYYY-MM-DD.
 */
function normalizeDateString(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Try YYYY-MM-DD or YYYY/MM/DD
  let match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try MM/DD/YYYY or MM-DD-YYYY
  match = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return undefined;
}
