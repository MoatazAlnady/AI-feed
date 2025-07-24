export const generateCSVTemplate = () => {
  const headers = [
    'Category',
    'Subcategory', 
    'Tool Name',
    'Tool Type',
    'Free Plan/Credits (Yes/No)',
    'Link',
    'Logo Link',
    'Tool Description',
    'Pricing',
    'Pros (separate with semicolons)',
    'Cons (separate with semicolons)',
    'Tags (separate with commas)',
    'Features (separate with semicolons)'
  ];

  const sampleData = [
    [
      'Conversational AI',
      'Text Generation',
      'ChatGPT',
      'Web App',
      'Yes',
      'https://chat.openai.com',
      'https://chat.openai.com/favicon.ico',
      'Advanced conversational AI for various tasks including writing, coding, and analysis.',
      'Freemium',
      'Excellent text generation; Wide range of capabilities; Regular updates; Large knowledge base',
      'Can hallucinate information; Limited real-time data; Usage limits on free tier',
      'AI, Chatbot, Writing, Coding',
      'Text generation; Code assistance; Language translation; Creative writing'
    ],
    [
      'Image Generation',
      'Art Creation',
      'Midjourney',
      'Desktop App',
      'No',
      'https://midjourney.com',
      'https://midjourney.com/favicon.ico',
      'Create stunning AI-generated artwork and images from text descriptions.',
      'Paid',
      'High-quality images; Artistic style; Active community; Regular model updates',
      'Discord-only interface; No free tier; Limited control options',
      'AI, Art, Images, Creative',
      'Text-to-image; Artistic styles; High resolution; Community gallery'
    ]
  ];

  const csvContent = [headers, ...sampleData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

export const downloadCSVTemplate = () => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ai-tools-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
            });
            return obj;
          });
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};