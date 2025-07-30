import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser"; // Dodaj kolory (npm install chalk)
import classifyRoute from "./routes/classify";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api/classify", classifyRoute);

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
            
            // Formatowanie linii
            const line = prefix + (isLast ? '└── ' : '├── ') + 
                (fs.statSync(fullPath).isDirectory() ? chalk.blue(entry) : chalk.green(entry));
            tree.push(line);

            // Rekurencyjne przeglądanie folderów (pomijanie linków symbolicznych)
            if (fs.statSync(fullPath).isDirectory() && !fs.lstatSync(fullPath).isSymbolicLink()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                tree.push(...generateFolderTree(fullPath, newPrefix));
            }
        });
    } catch (error) {
        tree.push(prefix + '└── ' + chalk.red(`[Error: ${error instanceof Error ? error.message : String(error)}]`));
    }
    return tree;
}

// Przykład użycia:
const targetDir = process.argv[2] || '.'; // Ścieżka z argumentu lub bieżący folder
console.log(chalk.yellow(`🌳 Drzewo folderów dla: ${targetDir}\n`));
generateFolderTree(targetDir).forEach(line => console.log(line));