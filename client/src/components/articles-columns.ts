import { type ColumnDef } from "@tanstack/react-table"
export type Article = {
  id: string
  title: string
  published_at: string
  link: string
  source_id: string
  content: string
}
export const columns: ColumnDef<Article>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "published_at", header: "Published" },
  { accessorKey: "link", header: "Link" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "sentiment", header: "Sentiment" },
  { accessorKey: "teams_mentioned", header: "Teams" }
]