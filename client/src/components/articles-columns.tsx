import { type ColumnDef } from "@tanstack/react-table"
import React from "react";

export type Article = {
  id: string
  title: string
  published_at: string
  link: string
  source_id: string
  category?: string
  sentiment?: string
  teams_mentioned?: string
  content: string
}


export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "title",
    id: "title",
    header: "Title",
    filterFn: "includesString",
  },
  {
    accessorKey: "published_at",
    id: "published_at",
    header: "Published",
    cell: ({ row }) =>
      new Date(row.getValue("published_at")).toLocaleDateString(),
  },
  { accessorKey: "link", id: "link", header: "Link" },
  { accessorKey: "category", id: "category", header: "Category" },
  {
    accessorKey: "content",
    id: "content",
    header: "Content",
    cell: ({ row }) => {
      const article = row.original as Article;

      return (
        <div className="relative">
          <div
            className="overflow-hidden text-ellipsis"
            style={{
              whiteSpace: 'pre-line',
              maxHeight: '150px',
            }}
          >
            {article.content}
          </div>
        </div>
      );
    },
  },
  { accessorKey: "sentiment", id: "sentiment", header: "Sentiment" },
  { accessorKey: "teams_mentioned", id: "teams_mentioned", header: "Teams" },
]