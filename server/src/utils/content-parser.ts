export interface ParsedContent {
  hashtags: string[];
  mentions: string[];
}

export function parseContent(text: string | undefined | null): ParsedContent {
  if (!text) {
    return { hashtags: [], mentions: [] };
  }

  const hashtagRegex = /#(\w+)/g;
  const mentionRegex = /@(\w+)/g;

  const hashtags: string[] = [];
  const mentions: string[] = [];

  let match: RegExpExecArray | null;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const tag = match[1].toLowerCase();
    if (!hashtags.includes(tag)) {
      hashtags.push(tag);
    }
  }

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return { hashtags, mentions };
}
