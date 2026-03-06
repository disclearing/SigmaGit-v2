import Markdown from "react-native-markdown-display";
import { markdownStyles } from "@/constants/markdownStyles";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
