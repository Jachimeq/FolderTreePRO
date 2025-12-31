import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from '../graphql/schema';
import resolvers from '../graphql/resolvers';


dotenv.config();

const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

/**
 * Generuje drzewo folderów z kolorami i obsługą błędów.
 * @param dirPath Ścieżka startowa.
 * @param prefix Prefix dla wcięć (używane rekurencyjnie).
 * @returns Linie drzewa folderów.
 */
function generateFolderTree(dirPath: string, prefix = ''): string[] {
  const tree: string[] = [];
  try {
    const entries = fs.readdirSync(dirPath).sort();

    entries.forEach((entry, index) => {
      const fullPath = path.join(dirPath, entry);
      const isLast = index === entries.length - 1;

      const line =
        prefix +
        (isLast ? '└── ' : '├── ') +
        (fs.statSync(fullPath).isDirectory()
          ? chalk.blue(entry)
          : chalk.green(entry));
      tree.push(line);

      if (
        fs.statSync(fullPath).isDirectory() &&
        !fs.lstatSync(fullPath).isSymbolicLink()
      ) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        tree.push(...generateFolderTree(fullPath, newPrefix));
      }
    });
  } catch (error) {
    tree.push(
      prefix +
        '└── ' +
        chalk.red(
          `[Error: ${error instanceof Error ? error.message : String(error)}]`
        )
    );
  }
  return tree;
}

// Start serwera z GraphQL
async function startServer() {
  try {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();
    server.applyMiddleware({ app: app as any });

    const PORT = Number(process.env.PORT) || 4010;
    console.log(`Attempting to start server on port ${PORT}...`);
    const httpServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server successfully listening at http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`Server address:`, httpServer.address());
    });
    
    httpServer.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    httpServer.on('listening', () => {
      console.log('✅ Server is now listening');
      console.log('Server should be accessible now...');
    });
    
    // Keep the process alive
    setInterval(() => {
      console.log('Server still running...');
    }, 10000);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
