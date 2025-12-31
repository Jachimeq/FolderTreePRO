import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type TreeNodeData {
    name: String!
    tags: [String!]!
  }

  type TreeNode {
    id: String!
    data: TreeNodeData!
  }

  type Query {
    hello: String
    classify(content: String!): [String]
    classifyOpenAI(content: String!): [String]
    getFolderTree(dir: String!): [TreeNode]
  }

  type Mutation {
    generateFiles(prompt: String!, basePath: String): String
  }
`;
