// Hashtag utility functions
export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#\w+/g;
  return text.match(hashtagRegex) || [];
};

export const formatHashtag = (hashtag: string): string => {
  return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
};

export const makeHashtagsClickable = (text: string): string => {
  return text.replace(/#\w+/g, '<span class="hashtag">$&</span>');
};