import axios from 'axios';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const resolvers = {
  Query: {
    hello: () => {
      return 'Hello';
    },
    classify: async (_: any, { content }: { content: string }) => {
      try {
        const response = await axios.post('http://localhost:11434/api/generate', {
          model: 'mistral',
          prompt: `Generate 3 comma-separated tags for this folder: ${content}. Return only the tags, no numbers or quotes.`,
          stream: false,
        });

        const result = response.data.response;
        return result
          .split(',')
          .map((tag: string) => tag.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } catch (err) {
        console.error('Błąd przy AI:', err);
        return [];
      }
    },
    classifyOpenAI: async (_: any, { content }: { content: string }) => {
      if (!openai) return ['OpenAI not configured'];
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates tags for folders.' },
            { role: 'user', content: `Generate 3 comma-separated tags for this folder: ${content}. Return only the tags.` },
          ],
        });
        const result = completion.choices[0].message.content || '';
        return result
          .split(',')
          .map((tag: string) => tag.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } catch (err) {
        console.error('Błąd przy OpenAI:', err);
        return [];
      }
    },
    getFolderTree: (_: any, { dir }: { dir: string }) => {
      const nodes: any[] = [];
      function scanDir(currentDir: string) {
        try {
          const entries = fs.readdirSync(currentDir);
          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stat = fs.statSync(fullPath);
            const id = fullPath.replace(/\\/g, '/'); // normalize path
            nodes.push({
              id,
              data: {
                name: entry,
                tags: [],
              },
            });
            if (stat.isDirectory()) {
              scanDir(fullPath);
            }
          }
        } catch (err) {
          console.error('Error scanning dir:', err);
        }
      }
      scanDir(dir);
      return nodes;
    },
  },
  Mutation: {
    generateFiles: async (_: any, { prompt, basePath }: { prompt: string, basePath: string }) => {
      const systemPrompt = `You are an AUTONOMOUS AI FILE AGENT working with a local application called FolderTreePRO.

YOUR MODE: DIRECT EXECUTION
NO QUESTIONS
NO CONFIRMATIONS
NO DISCUSSION

----------------------------------
ABSOLUTE RULES
----------------------------------

1. You NEVER ask questions.
2. You NEVER explain anything.
3. You NEVER use markdown.
4. You NEVER output anything except VALID JSON.
5. You ALWAYS choose an action and execute it.
6. You ALWAYS assume missing information in the safest possible way.
7. You NEVER stop because of ambiguity.

----------------------------------
DEFAULT ASSUMPTIONS (MANDATORY)
----------------------------------

• Default basePath: C:/Projects/FolderTreePRO_Auto
• Default language: TypeScript
• Default runtime: Node.js
• Default package manager: npm
• Default module system: ESModules
• Default backend framework: Express
• Default port: 3000

If the user does not specify a basePath, YOU MUST use the default basePath.
If the user does not specify a framework, YOU MUST use Express.
If the user does not specify file names, YOU MUST create sensible defaults.

----------------------------------
SUPPORTED ACTIONS
----------------------------------

create_structure
modify_file
delete_path
move_path

----------------------------------
JSON SCHEMAS
----------------------------------

create_structure:
{
  "action": "create_structure",
  "basePath": "<absolute_path>",
  "structure": {
    "<folder_or_file>": {
      "...": "..."
    }
  }
}

modify_file:
{
  "action": "modify_file",
  "path": "<relative_path>",
  "content": "<full file content>"
}

delete_path:
{
  "action": "delete_path",
  "path": "<relative_path>"
}

move_path:
{
  "action": "move_path",
  "from": "<relative_path>",
  "to": "<relative_path>"
}

----------------------------------
STRUCTURE RULES
----------------------------------

• Folder = object
• File = string (FULL FILE CONTENT)
• Always generate COMPLETE working files
• Never generate diffs or patches
• Never create more than 100 files at once

----------------------------------
SAFETY (NON-NEGOTIABLE)
----------------------------------

• NEVER access system folders
• NEVER go outside basePath
• NEVER execute shell commands
• NEVER reference external tools
• NEVER require user confirmation

----------------------------------
BEHAVIOR
----------------------------------

When the user says:
"Create", "Build", "Generate", "Make", "Setup"

→ You MUST immediately return a create_structure command.

When the user says:
"Change", "Update", "Refactor"

→ You MUST immediately return a modify_file command.

----------------------------------
FAILURE CONDITION
----------------------------------

If you ask a question or output anything other than JSON,
YOU HAVE FAILED YOUR TASK.`;
      try {
        const fullPrompt = systemPrompt + "\n\nUser: " + prompt;
        const response = await axios.post('http://localhost:11434/api/generate', {
          model: 'mistral',
          prompt: fullPrompt,
          stream: false,
        });
        const jsonStr = response.data.response?.trim();
        if (!jsonStr) return 'No response from Ollama';
        const action = JSON.parse(jsonStr);
        // Execute the action
        if (action.action === 'create_structure') {
          const bp = action.basePath || basePath;
          let count = 0;
          function createStructure(base: string, struct: any) {
            for (const key in struct) {
              if (count > 100) throw new Error('Too many files');
              const fullPath = path.join(base, key);
              if (typeof struct[key] === 'string') {
                fs.writeFileSync(fullPath, struct[key]);
                count++;
              } else {
                fs.mkdirSync(fullPath, { recursive: true });
                createStructure(fullPath, struct[key]);
              }
            }
          }
          createStructure(bp, action.structure);
          return 'Structure created successfully';
        } else if (action.action === 'modify_file') {
          const fullPath = path.join(basePath, action.path);
          fs.writeFileSync(fullPath, action.content);
          return 'File modified successfully';
        } else if (action.action === 'delete_path') {
          const fullPath = path.join(basePath, action.path);
          if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
              fs.rmSync(fullPath, { recursive: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
          return 'Path deleted successfully';
        } else if (action.action === 'move_path') {
          const fromPath = path.join(basePath, action.from);
          const toPath = path.join(basePath, action.to);
          fs.renameSync(fromPath, toPath);
          return 'Path moved successfully';
        } else {
          return 'Unknown action';
        }
      } catch (err: any) {
        return 'Error: ' + err.message;
      }
    }
  }
};

export default resolvers;
