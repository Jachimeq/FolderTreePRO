import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from '../graphql/schema';
import resolvers from '../graphql/resolvers.ts';


dotenv.config();

const app: Express = express();

app.use(cors());

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
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}${server.graphqlPath}`)
  );
}

startServer();

// Przykład użycia z CLI
const targetDir = process.argv[2] || '.';
console.log(chalk.yellow(`🌳 Drzewo folderów dla: ${targetDir}\n`));
generateFolderTree(targetDir).forEach((line) => console.log(line));
