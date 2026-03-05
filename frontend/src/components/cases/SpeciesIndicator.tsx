interface SpeciesIndicatorProps {
  species: string;
}

export default function SpeciesIndicator({ species }: SpeciesIndicatorProps) {
  // Get the first letter of the species for the icon
  const initial = species.charAt(0).toUpperCase();
  
  // Determine color based on common species
  const getSpeciesColor = (spec: string): string => {
    const lower = spec.toLowerCase();
    if (lower.includes('canine') || lower.includes('dog')) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
    if (lower.includes('feline') || lower.includes('cat')) {
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    }
    if (lower.includes('equine') || lower.includes('horse')) {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    }
    if (lower.includes('avian') || lower.includes('bird')) {
      return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700';
    }
    // Default color for other species
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  };

  const colorClass = getSpeciesColor(species);

  return (
    <div
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm ${colorClass}`}
      aria-label={`Species: ${species}`}
      title={`Species: ${species}`}
    >
      {initial}
    </div>
  );
}
