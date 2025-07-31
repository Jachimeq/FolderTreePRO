import axios from 'axios';

const resolvers = {
  Query: {
    classify: async (_: any, { content }: { content: string }) => {
      try {
        const response = await axios.post('http://localhost:11434/api/generate', {
          model: 'mistral',
          prompt: `Wygeneruj 3 tagi dla tego folderu: ${content}`,
          stream: false,
        });

        const result = response.data.response;
        return result
          .split(/[,;\n]+/)
          .map((tag: string) => tag.trim())
          .filter(Boolean);
      } catch (err) {
        console.error('Błąd przy AI:', err);
        return [];
      }
    },
  },
};

export default resolvers;
