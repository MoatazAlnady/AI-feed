export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
};

export const makeHashtagsClickable = (
  text: string, 
  onHashtagClick: (hashtag: string) => void
): React.ReactNode => {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const parts = text.split(hashtagRegex);
  const hashtags = text.match(hashtagRegex) || [];
  
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, index) => {
    result.push(part);
    if (hashtags[index]) {
      result.push(
        <button
          key={`hashtag-${index}`}
          onClick={() => onHashtagClick(hashtags[index])}
          className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer hover:underline"
        >
          {hashtags[index]}
        </button>
      );
    }
  });
  
  return result;
};

export const searchByHashtag = (hashtag: string, items: any[], searchFields: string[]): any[] => {
  const cleanHashtag = hashtag.toLowerCase().replace('#', '');
  
  return items.filter(item => {
    return searchFields.some(field => {
      const fieldValue = item[field];
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(value => 
          value.toLowerCase().includes(cleanHashtag)
        );
      }
      return fieldValue && fieldValue.toLowerCase().includes(cleanHashtag);
    });
  });
};

export const getPopularHashtags = (items: any[], contentField: string, limit: number = 10): Array<{tag: string, count: number}> => {
  const hashtagCounts: { [key: string]: number } = {};
  
  items.forEach(item => {
    const content = item[contentField] || '';
    const hashtags = extractHashtags(content);
    hashtags.forEach(hashtag => {
      hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
    });
  });
  
  return Object.entries(hashtagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};