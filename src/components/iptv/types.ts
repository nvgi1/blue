export type Category = "arabic" | "sports" | "news" | "entertainment";
export interface Channel { id: string; name: string; logo: string; description: string; quality: string; url: string; category: Category; }
